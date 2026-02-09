import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export default function ExcelHistory() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExcels();
  }, []);

  const fetchExcels = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/ocr/excels`);
      setFiles(res.data);
    } catch {
      setError("Failed to load Excel files");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fileName) => {
    window.open(`${API_BASE}/api/ocr/excels/${fileName}`, "_blank");
  };

  const deleteFile = async (fileName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${fileName}?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_BASE}/api/ocr/excels/${fileName}`
      );
      setFiles((prev) =>
        prev.filter((f) => f.fileName !== fileName)
      );
    } catch {
      alert("Failed to delete file");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Generated Excel Files
      </h1>

      {files.length === 0 ? (
        <p>No Excel files found.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">File Name</th>
              <th className="p-2 border">Size (KB)</th>
              <th className="p-2 border">Created At</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {files.map((file) => (
              <tr key={file.fileName}>
                <td className="p-2 border">{file.fileName}</td>
                <td className="p-2 border">{file.sizeKB}</td>
                <td className="p-2 border">
                  {new Date(file.createdAt).toLocaleString()}
                </td>
                <td className="p-2 border space-x-3">
                  <button
                    onClick={() => downloadFile(file.fileName)}
                    className="text-blue-600 underline"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => deleteFile(file.fileName)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={fetchExcels}
        className="mt-4 px-4 py-2 border rounded"
      >
        Refresh
      </button>
    </div>
  );
}