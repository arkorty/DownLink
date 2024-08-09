import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";

const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("480p");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  // Validate if the URL is a YouTube domain
  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleDownload = async (e) => {
    e.preventDefault();

    if (!url) {
      setMessage("maybe enter an URL first");
      return;
    } else if (!isValidYouTubeUrl(url)) {
      setMessage("doesn't look like YouTube to me");
      return;
    }

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
            setMessage("Downloading...");
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

      setMessage("Download Complete");
      setIsProcessing(false);
      setShowConfetti(true);
    } catch (error) {
      setMessage("Download Failed");
      console.error(error);
      setIsProcessing(false);
    }
  };

  const getBarClass = () => {
    if (message === "Download Complete") return "bg-green-500";
    if (message === "Download Failed") return "bg-red-500";
    return "bg-blue-500"; // Default color when not processing
  };

  const getBarStyle = () => ({
    transition: "width 0.5s ease-in-out",
  });

  const getAnimationStyle = () => {
    // Hide the loading animation when progress is greater than 0
    return progress === 0 ? { animation: "loading 1.5s infinite" } : {};
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
            <option value="360p">360p</option>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
          </select>
        </div>
        <div className="w-full bg-white rounded-full mt-4 h-4 relative overflow-hidden">
          <div
            className={`h-4 ${getBarClass()} rounded-full`}
            style={{
              width: `${progress}%`,
              ...getBarStyle(),
            }}
          ></div>
          {isProcessing && progress === 0 && (
            <div
              className={`absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full`}
              style={getAnimationStyle()}
            ></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-xs ${
                message === "Download Failed" ? "text-white" : "text-black"
              }`}
            >
              {message}
            </span>
          </div>
        </div>
        <div className="flex justify-center">
          {!isProcessing && !message.startsWith("Downloading") && (
            <button
              type="submit"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-lg shadow-lg text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download
            </button>
          )}
        </div>
      </form>

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
