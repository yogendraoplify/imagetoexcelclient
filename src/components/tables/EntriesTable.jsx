import { useState } from "react";
import axios from "axios";
import EditModal from "../modals/EditModal";
import { BASE_URL } from "../../constant/apiUrl";

export default function EntriesTable({ entries, onRefresh, showToast }) {
  const [editEntry, setEditEntry] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = entries.filter((e) =>
    [e.contactPerson, e.companyName, e.email, e.phoneNumbers]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/ocr/entries/${id}`);
      showToast("Entry deleted");
      onRefresh();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleExport = () => {
    window.open(`${BASE_URL}/api/ocr/entries/export`, "_blank");
  };

  return (
    <div>
      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={() => {
            onRefresh();
            setEditEntry(null);
            showToast("Entry updated");
          }}
          showToast={showToast}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Saved Entries</h1>
          <p className="text-sm text-gray-400 mt-1">
            {entries.length} business cards in database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#4674AB] bg-white min-w-[200px]"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 h-10 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#128a3d] transition"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v10M6 9l4 4 4-4M4 17h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export All to Excel
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#D9D9D9] mb-6" />

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#D5E8FF] bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#EEF4FF]">
              {["Contact", "Position", "Company", "Phone", "Email", "Website", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[#4674AB] font-semibold text-xs uppercase tracking-wide border-b border-[#D5E8FF] whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10 text-sm">
                  No entries found
                </td>
              </tr>
            ) : (
              filtered.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-[#F0F0F0] transition hover:bg-[#F8FBFF] ${
                    i % 2 === 0 ? "bg-white" : "bg-[#FAFBFF]"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-[#4674AB]">
                    {entry.contactPerson || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.position || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.companyName || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.phoneNumbers || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.website || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditEntry(entry)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EEF4FF] hover:bg-[#D5E8FF] transition"
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <path d="M4 16l3-1L16 6a1 1 0 00-2-2L5 13l-1 3z" stroke="#4674AB" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFE3E3] hover:bg-red-200 transition"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11" stroke="#D70000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}