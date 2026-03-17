import { useState, useEffect } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import CardRow from "../tables/CardRow";
import EntriesTable from "../tables/EntriesTable";
import { BASE_URL } from "../../constant/apiUrl";

const MAX_CARDS = 20;

// ─── Compression ──────────────────────────────────────────────────────────────
const compressAndEncode = async (file) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  });
  return {
    base64: await fileToBase64(compressed),
    mediaType: "image/jpeg",
  };
};

// ─── Base64 ───────────────────────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Extraction ───────────────────────────────────────────────────────────────
const extractDataFromCard = async (card) => {
  const images = [];

  if (card.frontImage) {
    const { base64, mediaType } = await compressAndEncode(card.frontImage);
    images.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    });
  }

  if (card.backImage) {
    const { base64, mediaType } = await compressAndEncode(card.backImage);
    images.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    });
  }

  const prompt = `Extract all information from this business card image(s).
Return ONLY a valid JSON object with no markdown, no explanation, no extra text:
{
  "contactPerson": "",
  "position": "",
  "companyName": "",
  "phoneNumbers": "",
  "email": "",
  "website": "",
  "addresses": ""
}
Rules:
- If multiple phone numbers exist, join them with ", "
- If multiple emails exist, join them with ", "
- If multiple addresses exist, join them with " | "
- If a field is not found, leave it as empty string ""
- Return ONLY the JSON object, nothing else`;

  const res = await axios.post(`${BASE_URL}/api/claude/extract`, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: [...images, { type: "text", text: prompt }] }],
  });

  const data = res.data;
  if (!res.data) throw new Error(data.error?.message || "Extraction failed");

  const text = data.content?.find((c) => c.type === "text")?.text || "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");

  const parsed = JSON.parse(match[0]);
  return {
    contactPerson: parsed.contactPerson || "",
    position:      parsed.position      || "",
    companyName:   parsed.companyName   || "",
    phoneNumbers:  parsed.phoneNumbers  || "",
    email:         parsed.email         || "",
    website:       parsed.website       || "",
    addresses: Array.isArray(parsed.addresses)
      ? parsed.addresses.join(" | ")
      : parsed.addresses || "",
  };
};

// ─── Deduplication ────────────────────────────────────────────────────────────
const deduplicateBatch = (rows) => {
  const seenEmails = new Set();
  const seenPhones = new Set();
  const duplicates = [];
  const unique = [];

  for (const row of rows) {
    const emails = row.email
      ? row.email.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [];
    const phones = row.phoneNumbers
      ? row.phoneNumbers.split(",").map((p) => p.trim().replace(/\s+/g, "")).filter(Boolean)
      : [];

    const isDupe =
      emails.some((e) => seenEmails.has(e)) ||
      phones.some((p) => seenPhones.has(p));

    if (isDupe) {
      duplicates.push(row);
    } else {
      emails.forEach((e) => seenEmails.add(e));
      phones.forEach((p) => seenPhones.add(p));
      unique.push(row);
    }
  }
  return { unique, duplicates };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CardUploader() {
  const [cards, setCards]           = useState([]);
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [tab, setTab]               = useState("upload");
  const [toast, setToast]           = useState(null);
  const [cardStatus, setCardStatus] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/ocr/entries`);
      setEntries(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const addCard = () => {
    if (cards.length >= MAX_CARDS) return showToast("Max 20 cards allowed", "error");
    setCards((c) => [...c, { id: crypto.randomUUID(), frontImage: null, backImage: null }]);
  };

  const removeCard = (id) => setCards((c) => c.filter((card) => card.id !== id));

  const updateCard = (id, field, file) =>
    setCards((c) => c.map((card) => (card.id === id ? { ...card, [field]: file } : card)));

  const submit = async () => {
    const valid = cards.filter((c) => c.frontImage);
    if (valid.length === 0) return showToast("Add at least one card with a front image", "error");

    setLoading(true);
    setCardStatus(valid.map(() => "pending"));

    try {
      const rows = [];

      for (let i = 0; i < valid.length; i++) {
        setCardStatus((prev) => prev.map((s, idx) => (idx === i ? "processing" : s)));
        try {
          const parsed = await extractDataFromCard(valid[i]);
          rows.push(parsed);
          setCardStatus((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
        } catch {
          rows.push(null);
          setCardStatus((prev) => prev.map((s, idx) => (idx === i ? "error" : s)));
        }
      }

      const validRows = rows.filter(Boolean);
      if (validRows.length === 0) { showToast("Failed to extract data from all cards", "error"); return; }

      const { unique, duplicates } = deduplicateBatch(validRows);
      if (unique.length === 0) { showToast("All cards in this batch are duplicates", "error"); return; }

      const res = await axios.post(`${BASE_URL}/api/ocr/cards`, { rows: unique });
      const { savedCount, skippedCount } = res.data;
      const batchDupes = duplicates.length;
      const total = batchDupes + skippedCount;

      total > 0
        ? showToast(`${savedCount} saved · ${batchDupes} duplicate(s) in batch · ${skippedCount} already in DB`, "info")
        : showToast(`${savedCount} card(s) saved successfully!`);

      const excelRes = await axios.get(`${BASE_URL}/api/ocr/entries/export`, { responseType: "blob" });
      const url = URL.createObjectURL(excelRes.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "business-cards.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      setCards([]);
      setCardStatus([]);
      fetchEntries();
      setTab("entries");
    } catch (e) {
      showToast(e.message || "Failed to process cards", "error");
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status) => {
    if (status === "processing")
      return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(70,116,171,0.3)" strokeWidth="2" />
          <path d="M12 2a10 10 0 0110 10" stroke="#4674AB" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    if (status === "done")
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#16A34A" strokeWidth="1.5" />
          <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    if (status === "error")
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    return <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-50" />;
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F8FB] font-['Inter']">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-lg transition-all
          ${toast.type === "error" ? "bg-red-500" : toast.type === "info" ? "bg-[#4674AB]" : "bg-[#16A34A]"}`}>
          {toast.msg}
        </div>
      )}

      <header className="bg-white border-b border-[#D5E8FF] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪪</span>
          <span className="text-xl font-bold text-[#4674AB] tracking-tight">CardScan Pro</span>
        </div>
        <nav className="flex gap-2">
          {[
            { key: "upload", label: "Upload Cards" },
            { key: "entries", label: `Entries (${entries.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                ${tab === key
                  ? "bg-[#EEF4FF] text-[#4674AB] border-[#4674AB]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#4674AB] hover:text-[#4674AB]"}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 py-8">
        {tab === "upload" ? (
          <div>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-800">Scan Business Cards</h1>
              <p className="text-gray-400 text-sm mt-1">
                Powered by Claude Vision — images are compressed client-side, never stored.
              </p>
            </div>
            <div className="border-t border-[#D9D9D9] mb-7" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {cards.map((card, i) => (
                <div key={card.id} className="relative">
                  {cardStatus[i] && (
                    <div className={`absolute -top-2 -right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border
                      ${cardStatus[i] === "done"       ? "bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]"
                      : cardStatus[i] === "processing" ? "bg-[#EEF4FF] border-[#4674AB] text-[#4674AB]"
                      : cardStatus[i] === "error"      ? "bg-red-50 border-red-300 text-red-500"
                                                       : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                      {statusIcon(cardStatus[i])}
                      {cardStatus[i] === "processing" ? "Reading..."
                        : cardStatus[i] === "done"    ? "Done"
                        : cardStatus[i] === "error"   ? "Failed"
                                                      : "Pending"}
                    </div>
                  )}
                  <CardRow index={i} card={card} onChange={updateCard} onRemove={removeCard} />
                </div>
              ))}
            </div>

            {cards.length > 0 && <div className="border-t border-[#D9D9D9] mb-7" />}

            <div className="flex items-center justify-center gap-5 mt-4">
              <button onClick={addCard}
                className="flex items-center gap-2 px-6 h-11 rounded-lg bg-[#4674AB] text-white text-base font-semibold hover:bg-[#3a5e8f] transition">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add Card
              </button>

              {cards.length > 0 && (
                <button onClick={() => { setCards([]); setCardStatus([]); }}
                  className="flex items-center gap-2 px-6 h-11 rounded-lg bg-[#7A5491] text-white text-base font-semibold hover:bg-[#653f7a] transition">
                  Reset
                </button>
              )}

              {cards.length > 0 && (
                <button onClick={submit} disabled={loading}
                  className="flex items-center gap-2 px-6 h-11 rounded-lg bg-[#16A34A] text-white text-base font-semibold hover:bg-[#128a3d] disabled:opacity-60 transition">
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                        <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Extracting...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="2" width="14" height="16" rx="2" stroke="#fff" strokeWidth="1.5" />
                        <path d="M7 7h6M7 10h6M7 13h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Extract & Download
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <EntriesTable entries={entries} onRefresh={fetchEntries} showToast={showToast} />
        )}
      </main>
    </div>
  );
}