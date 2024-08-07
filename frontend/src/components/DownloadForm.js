import React, { useState } from "react";
import axios from "axios";

const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [message, setMessage] = useState("");

  const handleDownload = async (e) => {
    e.preventDefault();
    setMessage("Downloading...");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/downlink/download`,
        { url, quality },
        {
          responseType: "blob", // Ensure the response is treated as a file
        },
      );

      // Extract the filename from the Content-Disposition header if present
      const disposition = response.headers["content-disposition"];
      const filename = disposition
        ? disposition.split("filename=")[1].replace(/"/g, "")
        : "video.mp4"; // Default filename

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.download = filename;
      link.click();

      setMessage("Download complete");
    } catch (error) {
      setMessage("Download failed");
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleDownload} className="space-y-4">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700"
          >
            Video URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter video URL"
          />
        </div>
        <div>
          <label
            htmlFor="quality"
            className="block text-sm font-medium text-gray-700"
          >
            Quality
          </label>
          <select
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download
          </button>
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default DownloadForm;
