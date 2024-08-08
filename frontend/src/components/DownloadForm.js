import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";

const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    setMessage("Processing...");
    setProgress(0);
    setIsProcessing(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/downlink/download`,
        { url, quality },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            setProgress(Math.round((current / total) * 100));
          },
        },
      );

      const disposition = response.headers["content-disposition"];
      const filename = disposition
        ? disposition.split("filename=")[1].replace(/"/g, "")
        : `${uuidv4()}.mp4`;

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.download = filename;
      link.click();

      setMessage("Download complete");
      setIsProcessing(false);
      setShowConfetti(true);
    } catch (error) {
      setMessage("Download failed");
      console.error(error);
      setIsProcessing(false);
    }
  };

  const getBarClass = () => {
    if (message === "Download complete") return "bg-green-500";
    if (message === "Download failed") return "bg-red-500";
    return "bg-blue-500"; // Default color when not processing
  };

  const getBarStyle = () => {
    if (message === "Download complete" || message === "Download failed") {
      return { transition: "width 0.5s ease-in-out" };
    }
    return { transition: "width 0.5s ease-in-out" };
  };

  const getAnimationStyle = () => {
    if (message === "Download complete" || message === "Download failed") {
      return { animation: "none" };
    }
    return { animation: "loading 1.5s infinite" };
  };

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="p-4 relative">
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download
          </button>
        </div>
      </form>
      <div className="w-full bg-white rounded-full mt-4 h-3 relative overflow-hidden">
        <div
          className={`h-3 ${getBarClass()} rounded-full`}
          style={{
            width: `${progress}%`,
            ...getBarStyle(),
          }}
        ></div>
        {isProcessing && (
          <div
            className={`absolute top-0 left-0 w-full h-full bg-blue-300 rounded-full`}
            style={getAnimationStyle()}
          ></div>
        )}
      </div>
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full z-50">
          <Confetti
            ref={confettiRef}
            width={window.innerWidth}
            height={window.innerHeight}
          />
        </div>
      )}
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default DownloadForm;
