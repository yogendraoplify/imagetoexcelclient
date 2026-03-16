import { useState, useEffect } from "react";
import axios from "axios";
import CardRow from "./tables/CardRow";
import EntriesTable from "./tables/EntriesTable";
import { BASE_URL } from "../constant/apiUrl";

const MAX_CARDS = 20;

export default function CardUploader() {
  const [cards, setCards] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("upload");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntries = async () => {
    const res = await axios.get(`${BASE_URL}/api/ocr/entries`);
    setEntries(res.data);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

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
      c.map((card) => (card.id === id ? { ...card, [field]: file } : card)),
    );

  const submit = async () => {
    const valid = cards.filter((c) => c.frontImage);
    if (valid.length === 0)
      return showToast("Add at least one card with a front image", "error");

    setLoading(true);
    try {
      const form = new FormData();
      valid.forEach((card, i) => {
        form.append(`cards[${i}][front]`, card.frontImage);
        if (card.backImage) form.append(`cards[${i}][back]`, card.backImage);
      });

      // Response is now a binary Excel file, not JSON
      const res = await axios.post(`${BASE_URL}/api/ocr/cards`, form, {
        responseType: "blob",
        timeout: 120000, // 2 minutes timeout for processing
      });

      // Trigger browser download
      // const url = URL.createObjectURL(res.data);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = "business-cards.xlsx";
      // a.click();
      // URL.revokeObjectURL(url);

      showToast("Cards processed and downloaded!");
      setCards([]);
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
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-lg transition-all
            ${toast.type === "error" ? "bg-red-500" : "bg-[#16A34A]"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#D5E8FF] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪪</span>
          <span className="text-xl font-bold text-[#4674AB] tracking-tight">
            CardScan Pro
          </span>
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
                ${
                  tab === key
                    ? "bg-[#EEF4FF] text-[#4674AB] border-[#4674AB]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#4674AB] hover:text-[#4674AB]"
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="max-w-[1240px] mx-auto px-6 py-8">
        {tab === "upload" ? (
          <div>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-800">
                Scan Business Cards
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Upload front (required) + back of cards. Max 20 at once.
              </p>
            </div>

            {/* Divider */}
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
                />
              ))}
            </div>

            {/* Divider */}
            {cards.length > 0 && (
              <div className="border-t border-[#D9D9D9] mb-7" />
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-5 mt-4">
              {/* Add Card */}
              <button
                onClick={addCard}
                className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#4674AB] text-white text-base font-semibold transition hover:bg-[#3a5e8f]"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add Card
              </button>

              {/* Reset */}
              {cards.length > 0 && (
                <button
                  onClick={() => setCards([])}
                  className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#7A5491] text-white text-base font-semibold transition hover:bg-[#653f7a]"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4.5 8.5A5.5 5.5 0 1110 4.5V3M10 3l-2 2 2 2"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Reset
                </button>
              )}

              {/* Convert to Excel / Download */}
              {cards.length > 0 && (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#16A34A] text-white text-base font-semibold transition hover:bg-[#128a3d] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 2a10 10 0 0110 10"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="2"
                          width="14"
                          height="16"
                          rx="2"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M7 7h6M7 10h6M7 13h4"
                          stroke="#fff"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Convert
                    </>
                  )}
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
