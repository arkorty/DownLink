import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";

const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("360p");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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

    setProgress(0);
    setIsDownloading(true);
    setMessage("Downloading...");

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

      setMessage("Download Complete");
      setIsDownloading(false);
      setShowConfetti(true);
    } catch (error) {
      setMessage("Download Failed");
      console.error(error);
      setIsDownloading(false);
    }
  };

  const getBarClass = () => {
    if (message === "Download Complete") return "bg-green-400";
    if (message === "Download Failed") return "bg-red-400";
    return "bg-blue-500";
  };

  const getBarStyle = () => ({
    transition: "width 0.5s ease-in-out",
  });

  const getAnimationStyle = () => {
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
        <div className="flex gap-2">
          <div className="flex-grow">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 text-left"
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
          <div className="flex-shrink-0 w-18">
            <label
              htmlFor="quality"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Quality
            </label>
            <select
              id="quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="360p">Normal</option>
              <option value="480p">High</option>
              <option value="720p">Highest</option>
            </select>
          </div>
        </div>

        <div
          className={`w-full bg-white rounded-lg mt-4 h-6 relative overflow-hidden ${
            progress > 0 || (isDownloading && progress === 0)
              ? "border border-gray-300"
              : ""
          }`}
        >
          <div
            className={`h-full ${getBarClass()} rounded-lg`}
            style={{
              width: `${progress}%`,
              ...getBarStyle(),
            }}
          ></div>
          {isDownloading && progress === 0 && (
            <div
              className={`absolute top-0 left-0 w-full h-full bg-blue-400 rounded-full`}
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
          {!isDownloading && !message.startsWith("Downloading") && (
            <button
              type="submit"
              className="relative inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-lg text-white bg-gradient-to-r from-cyan-500 via-green-500 to-blue-500 hover:shadow-lg focus:outline-none animate-gradient"
            >
              <span className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ease-in-out active:opacity-40 rounded-lg"></span>
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

        @keyframes gradientFlow {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        .animate-gradient {
          background-size: 300% 300%;
          animation: gradientFlow 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default DownloadForm;
