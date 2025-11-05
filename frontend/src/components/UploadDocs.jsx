import React, { useState } from "react";
import { getApiUrl } from "../utils/apiConfig";

function UploadDocs() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, and PNG are allowed.");
      setSelectedFile(null);
    } else {
      setError("");
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a valid file to upload.");
      return;
    }

    setUploading(true);
    const apiUrl = getApiUrl();
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      const result = await response.json();
      setUploadedFiles((prev) => [...prev, result.filename || selectedFile.name]);
      setSelectedFile(null);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Upload Documents 📄</h1>
      <p className="mb-6 text-gray-700">
        Please upload the required documents before your joining day. Accepted formats: PDF, JPG, PNG.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          aria-label="Select document to upload"
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {selectedFile && !error && (
        <p className="text-gray-600 mb-4">
          Selected file: <span className="font-medium">{selectedFile.name}</span>
        </p>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2 text-gray-800">Uploaded Files:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UploadDocs;