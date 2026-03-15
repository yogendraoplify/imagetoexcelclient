import { useRef } from "react";

export default function CardRow({ index, card, onChange, onRemove }) {
  const frontRef = useRef();
  const backRef = useRef();

  const Preview = ({ file, label, required, inputRef, field }) => (
    <div
      onClick={() => inputRef.current.click()}
      className={`flex-1 flex flex-col items-center justify-center gap-2 border rounded-lg cursor-pointer py-3 px-2 transition
        ${file
          ? "border-[#16A34A] bg-[#F0FDF4]"
          : "border-dashed border-[#4674AB]/30 bg-white hover:border-[#4674AB]/60 hover:bg-[#EEF4FF]"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(card.id, field, e.target.files[0])}
      />
      {file ? (
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          className="w-full h-[68px] object-cover rounded"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 h-[68px] justify-center">
          {/* Cloud upload icon */}
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path
              d="M12 24H10a6 6 0 010-12 6 6 0 0111.66-1.32A5 5 0 1126 24h-2"
              stroke="#4674AB"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 17v8M15 20l3-3 3 3"
              stroke="#4674AB"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] text-gray-400">Click to upload</span>
        </div>
      )}
      <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {!required && (
          <span className="text-[10px] text-gray-400">(optional)</span>
        )}
      </div>
    </div>
  );

  return (
    /* Modal card — white bg, #D5E8FF border, rounded-2xl */
    <div className="relative bg-white border border-[#D5E8FF] rounded-2xl p-4 isolation-isolate">

      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#4674AB]">
          Card #{index + 1}
        </span>

        {/* Delete button — red circle */}
        <button
          onClick={() => onRemove(card.id)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFE3E3] hover:bg-red-200 transition"
          title="Remove card"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11"
              stroke="#D70000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Front + Back upload slots */}
      <div className="flex gap-3">
        <Preview
          file={card.frontImage}
          label="Front"
          required
          inputRef={frontRef}
          field="frontImage"
        />
        <Preview
          file={card.backImage}
          label="Back"
          required={false}
          inputRef={backRef}
          field="backImage"
        />
      </div>

      {/* Status indicators (shown when files are uploaded) */}
      {(card.frontImage || card.backImage) && (
        <div className="flex gap-2 mt-3">
          {card.frontImage && (
            <div className="flex-1 flex items-center justify-center gap-1 border border-[#16A34A] rounded-lg py-2">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#16A34A" strokeWidth="1.5" />
                <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-[#16A34A]">Front set</span>
            </div>
          )}
          {card.backImage && (
            <div className="flex-1 flex items-center justify-center gap-1 border border-[#16A34A] rounded-lg py-2">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#16A34A" strokeWidth="1.5" />
                <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-[#16A34A]">Back set</span>
            </div>
          )}
          {card.frontImage && !card.backImage && (
            <div className="flex-1 flex items-center justify-center gap-1 border border-[#4674AB] rounded-lg py-2 cursor-pointer hover:bg-[#EEF4FF]"
              onClick={() => backRef.current.click()}>
              <span className="text-sm font-semibold text-[#4674AB]">
                Add back side
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}