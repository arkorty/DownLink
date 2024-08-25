import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";
import Notification from "./Notification";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";

const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("360p");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState(null);

  const isValidUrl = (url) => {
    const legalDomains =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|instagram\.com)\/.+$/;
    return legalDomains.test(url);
  };

  const handleDownload = async (e) => {
    e.preventDefault();

    if (!url) {
      setNotification("Maybe enter an URL first");
      return;
    } else if (!isValidUrl(url)) {
      setNotification("Doesn't look like a valid URL to me");
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
    return "bg-purple-600";
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
    <div className="p-6 relative">
      <form onSubmit={handleDownload} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-grow">
            <FormControl fullWidth variant="outlined" size="small">
              <TextField
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                label="Video URL"
                placeholder="Enter video URL"
                variant="outlined"
                size="small"
                InputProps={{
                  style: {
                    color: "#fff",
                    backgroundColor: "#1f2937",
                  },
                }}
                InputLabelProps={{
                  style: { color: "#9ca3af" },
                }}
              />
            </FormControl>
          </div>
          <div className="flex-shrink-0 w-18">
            <FormControl
              fullWidth
              variant="outlined"
              size="small"
              sx={{ minWidth: 112 }}
            >
              <InputLabel htmlFor="quality" sx={{ color: "#9ca3af" }}>
                Quality
              </InputLabel>
              <Select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                label="Quality"
                variant="outlined"
                size="small"
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: "#1f2937",
                      color: "#fff",
                    },
                  },
                }}
                sx={{ backgroundColor: "#1f2937", color: "#fff" }}
              >
                <MenuItem value="360p">Standard</MenuItem>
                <MenuItem value="480p">High</MenuItem>
                <MenuItem value="720p">Ultra</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
        <div
          className={`w-full rounded-full mt-4 h-6 relative overflow-hidden ${
            progress > 0 || (isDownloading && progress === 0)
              ? "bg-white bg-opacity-60"
              : "bg-inherit"
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
              className={`absolute top-0 left-0 w-full h-full bg-purple-400 rounded-full`}
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
              className="relative inline-flex items-center px-10 py-6 text-2xl font-bold rounded-2xl text-white bg-purple-900 bg-opacity-60 focus:outline-none transition-all duration-300"
            >
              <span className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ease-in-out active:opacity-40 rounded-2xl"></span>
              {isDownloading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Download"
              )}
            </button>
          )}
        </div>
      </form>

      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full z-50">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            gravity={0.2}
            initialVelocityY={10}
            fadeOut={true}
            fadeOutDuration={2000}
          />
        </div>
      )}
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default DownloadForm;
