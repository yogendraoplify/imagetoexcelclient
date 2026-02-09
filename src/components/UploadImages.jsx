import { useState } from "react";
import axios from "axios";

export default function UploadImages() {
  const [files, setFiles] = useState([]);
  const [download, setDownload] = useState("");

  const uploadImages = async () => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    const res = await axios.post(
      "http://localhost:5000/api/ocr/upload",
      formData
    );

    setDownload(`http://localhost:5000/${res.data.excelPath}`);
  };

  return (
    <div className="p-6">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button onClick={uploadImages} className="ml-4">
        Upload & Convert
      </button>

      {download && (
        <a href={download} download>
          Download Excel
        </a>
      )}
    </div>
  );
}