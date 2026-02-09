import { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function BusinessCardExtractor() {
  const [cards, setCards] = useState([]);
  const [currentCard, setCurrentCard] = useState({ front: null, back: null });
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState([]);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleImageUpload = (side, file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentCard((prev) => ({
        ...prev,
        [side]: {
          file,
          preview: e.target.result,
          base64: e.target.result.split(",")[1],
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const addCardToQueue = () => {
    if (!currentCard.front && !currentCard.back) return;

    setCards((prev) => [...prev, currentCard]);
    setCurrentCard({ front: null, back: null });

    frontInputRef.current.value = "";
    backInputRef.current.value = "";
  };

  const removeCard = (index) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const extractDataFromCard = async (card) => {
    const images = [];

    if (card.front) {
      images.push({
        type: "image",
        source: {
          type: "base64",
          media_type: card.front.file.type,
          data: card.front.base64,
        },
      });
    }

    if (card.back) {
      images.push({
        type: "image",
        source: {
          type: "base64",
          media_type: card.back.file.type,
          data: card.back.base64,
        },
      });
    }

    const prompt = `
Extract all information from this business card image(s).
Return ONLY a JSON object:

{
  "contact_person_name": "",
  "position": "",
  "company_name": "",
  "phone_number": "",
  "email": "",
  "website": "",
  "addresses": []
}
`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ⚠️ DO NOT expose API key in frontend in production
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", 
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [...images, { type: "text", text: prompt }],
            },
          ],
        }),
      });

      const data = await res.json();
      const text = data.content?.find((c) => c.type === "text")?.text || "";

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON");

      const parsed = JSON.parse(match[0]);

      return {
        contact_person_name: parsed.contact_person_name || "",
        position: parsed.position || "",
        company_name: parsed.company_name || "",
        phone_number: parsed.phone_number || "",
        email: parsed.email || "",
        website: parsed.website || "",
        addresses: Array.isArray(parsed.addresses)
          ? parsed.addresses.join("; ")
          : "",
      };
    } catch (err) {
      console.error(err);
      return {
        contact_person_name: "",
        position: "",
        company_name: "",
        phone_number: "",
        email: "",
        website: "",
        addresses: "",
      };
    }
  };

  const processAllCards = async () => {
    setProcessing(true);
    const results = [];

    for (const card of cards) {
      const data = await extractDataFromCard(card);
      results.push(data);
    }

    setExtractedData(results);
    setProcessing(false);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      extractedData.map((d) => ({
        "Contact Person Name": d.contact_person_name,
        "Position in Company": d.position,
        "Company Name": d.company_name,
        "Phone Number": d.phone_number,
        Email: d.email,
        "Website Link": d.website,
        Addresses: d.addresses,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Business Cards");
    XLSX.writeFile(workbook, "business_cards_data.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          📇 Business Card Data Extractor
        </h1>

        {/* Upload */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload("front", e.target.files[0])}
            />
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload("back", e.target.files[0])}
            />
          </div>

          <button
            onClick={addCardToQueue}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          >
            Add Card
          </button>
        </div>

        {/* Queue */}
        {cards.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <button
              onClick={processAllCards}
              disabled={processing}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              {processing ? "Processing..." : "Extract Data"}
            </button>
          </div>
        )}

        {/* Results */}
        {extractedData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <button
              onClick={downloadExcel}
              className="w-full bg-indigo-600 text-white py-2 rounded"
            >
              Download Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}