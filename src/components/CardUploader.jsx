import { useState } from "react";
import axios from "axios";
import CardRow from "./CardRow";

export default function CardUploader() {
  const [cards, setCards] = useState([]);

  const addCard = () => {
    setCards((c) => [
      ...c,
      { id: crypto.randomUUID(), frontImage: null, backImage: null },
    ]);
  };

  const updateCard = (id, field, file) => {
    setCards((cards) =>
      cards.map((c) => (c.id === id ? { ...c, [field]: file } : c))
    );
  };

  const submit = async () => {
    const form = new FormData();

    cards.forEach((card, index) => {
      if (card.frontImage)
        form.append(`cards[${index}][front]`, card.frontImage);
      if (card.backImage)
        form.append(`cards[${index}][back]`, card.backImage);
    });

    const res = await axios.post(
      "http://localhost:5000/api/ocr/cards",
      form
    );

  };

  return (
    <div className="p-6 space-y-4">
      <button onClick={addCard}>➕ Add Card</button>

      {cards.map((card, i) => (
        <CardRow key={card.id} index={i} card={card} onChange={updateCard} />
      ))}

      {cards.length > 0 && (
        <button onClick={submit}>Convert to Excel</button>
      )}
    </div>
  );
}