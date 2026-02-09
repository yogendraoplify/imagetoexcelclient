export default function CardRow({ index, card, onChange }) {
  return (
    <div className="border p-4 rounded">
      <h4>Card #{index + 1}</h4>

      <div>
        <label>Front Card</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            onChange(card.id, "frontImage", e.target.files[0])
          }
        />
      </div>

      <div>
        <label>Back Card</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            onChange(card.id, "backImage", e.target.files[0])
          }
        />
      </div>
    </div>
  );
}