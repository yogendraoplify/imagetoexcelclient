import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constant/apiUrl";

const FIELDS = [
  { key: "contactPerson", label: "Contact Person" },
  { key: "position", label: "Position" },
  { key: "companyName", label: "Company Name" },
  { key: "phoneNumbers", label: "Phone Number(s)" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "addresses", label: "Address" },
];

export default function EditModal({ entry, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ ...entry });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${BASE_URL}/api/ocr/entries/${entry.id}`, form);
      onSaved();
    } catch {
      showToast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
  
      <div
        className="relative bg-white border border-[#D5E8FF] rounded-2xl w-[90%] max-w-[480px] max-h-[85vh] overflow-y-auto isolation-isolate shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
    
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <h2 className="text-lg font-bold text-gray-800">Edit Entry</h2>

      
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

    
        <div className="h-[10px]" />

    
        <div className="px-4 pb-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  value={form[key] || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#4674AB] focus:ring-1 focus:ring-[#4674AB]/20 transition bg-white"
                />
              </div>
            ))}
          </div>

      
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 font-semibold hover:border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4674AB] text-white text-sm font-semibold hover:bg-[#3a5e8f] disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
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
                  Saving…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 13v3h12v-3M10 3v9m-3-3l3 3 3-3"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}