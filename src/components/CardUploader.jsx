import { useState, useEffect } from "react";
import axios from "axios";
import CardRow from "./tables/CardRow";
import { BASE_URL } from "../constant/apiUrl";
import { extractTextFromImage } from "../utils/ocr";
import { parseBusinessCard } from "../utils/parseBusinessCard";
import EntriesTable from "./tables/EntriesTable";

const MAX_CARDS = 20;

export default function CardUploader() {
  const [cards, setCards] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("upload");
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState([]); // per-card OCR progress

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntries = async () => {
    const res = await axios.get(`${BASE_URL}/api/ocr/entries`);
    setEntries(res.data);
  };

  useEffect(() => { fetchEntries(); }, []);

  const addCard = () => {
    if (cards.length >= MAX_CARDS)
      return showToast("Max 20 cards allowed", "error");
    setCards((c) => [
      ...c,
      { id: crypto.randomUUID(), frontImage: null, backImage: null },
    ]);
  };

  const removeCard = (id) =>
    setCards((c) => c.filter((card) => card.id !== id));

  const updateCard = (id, field, file) =>
    setCards((c) =>
      c.map((card) => (card.id === id ? { ...card, [field]: file } : card))
    );

  const submit = async () => {
    const valid = cards.filter((c) => c.frontImage);
    if (valid.length === 0)
      return showToast("Add at least one card with a front image", "error");

    setLoading(true);
    setProgress(valid.map(() => ({ front: 0, back: 0 })));

    try {
      const rows = [];

      // Run OCR entirely in the browser
      for (let i = 0; i < valid.length; i++) {
        const card = valid[i];

        const frontText = await extractTextFromImage(
          card.frontImage,
          (pct) =>
            setProgress((prev) =>
              prev.map((p, idx) => (idx === i ? { ...p, front: pct } : p))
            )
        );

        let backText = "";
        if (card.backImage) {
          backText = await extractTextFromImage(
            card.backImage,
            (pct) =>
              setProgress((prev) =>
                prev.map((p, idx) => (idx === i ? { ...p, back: pct } : p))
              )
          );
        }

        const parsed = parseBusinessCard(frontText + "\n" + backText);
        rows.push(parsed);
      }

      // Send only the clean parsed JSON — no images, no files
      const res = await axios.post(`${BASE_URL}/api/ocr/cards`, { rows });

      // Download Excel returned from server
      const excelRes = await axios.get(`${BASE_URL}/api/ocr/entries/export`, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(excelRes.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "business-cards.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      showToast(`${res.data.savedCount} card(s) saved!`);
      setCards([]);
      setProgress([]);
      fetchEntries();
      setTab("entries");
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to process cards", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F8FB] font-['Inter']">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-lg
          ${toast.type === "error" ? "bg-red-500" : "bg-[#16A34A]"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#D5E8FF] px-8 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪪</span>
          <span className="text-xl font-bold text-[#4674AB] tracking-tight">CardScan Pro</span>
        </div>
        <nav className="flex gap-2">
          {[
            { key: "upload", label: "Upload Cards" },
            { key: "entries", label: `Entries (${entries.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                ${tab === key
                  ? "bg-[#EEF4FF] text-[#4674AB] border-[#4674AB]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#4674AB] hover:text-[#4674AB]"}`}
            >
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
                OCR runs in your browser — images never leave your device.
              </p>
            </div>

            <div className="border-t border-[#D9D9D9] mb-7" />

            {/* Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {cards.map((card, i) => (
                <CardRow
                  key={card.id}
                  index={i}
                  card={card}
                  onChange={updateCard}
                  onRemove={removeCard}
                  progress={progress[i]}
                />
              ))}
            </div>

            {cards.length > 0 && (
              <div className="border-t border-[#D9D9D9] mb-7" />
            )}

            {/* Per-card OCR progress (shown while processing) */}
            {loading && progress.length > 0 && (
              <div className="mb-6 flex flex-col gap-3">
                {progress.map((p, i) => (
                  <div key={i} className="bg-white border border-[#D5E8FF] rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-[#4674AB] mb-2">
                      Card #{i + 1}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-10">Front</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#4674AB] h-1.5 rounded-full transition-all"
                            style={{ width: `${p.front}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{p.front}%</span>
                      </div>
                      {cards[i]?.backImage && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-10">Back</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-[#7A5491] h-1.5 rounded-full transition-all"
                              style={{ width: `${p.back}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{p.back}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-5 mt-4">
              <button
                onClick={addCard}
                className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#4674AB] text-white text-base font-semibold transition hover:bg-[#3a5e8f]"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add Card
              </button>

              {cards.length > 0 && (
                <button
                  onClick={() => setCards([])}
                  className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#7A5491] text-white text-base font-semibold transition hover:bg-[#653f7a]"
                >
                  Reset
                </button>
              )}

              {cards.length > 0 && (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#16A34A] text-white text-base font-semibold transition hover:bg-[#128a3d] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                        <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Processing…
                    </>
                  ) : "Download Excel"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <EntriesTable
            entries={entries}
            onRefresh={fetchEntries}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}