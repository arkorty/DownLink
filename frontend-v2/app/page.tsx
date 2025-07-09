"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Link,
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { getApiBaseUrl } from "../lib/utils";
import { Toaster, toast } from "sonner";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleDownload = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    if (!quality) {
      toast.error("Please select a quality");
      return;
    }

    setIsDownloading(true);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/d/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          quality: quality,
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && (contentType.includes("application/octet-stream") || contentType.includes("video/mp4"))) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          // Try to get filename from Content-Disposition header
          const contentDisposition = response.headers.get("content-disposition");
          let filename = `video_${quality}.mp4`;
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^";]+)"?/);
            if (match && match[1]) {
              filename = match[1];
            }
          }
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("Download completed successfully!");
        } else {
          const data = await response.json();
          toast.success(data.message || "Download initiated successfully!");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Download failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/d/`);
      if (response.ok) {
        toast.success("Service is healthy and running!");
      } else {
        toast.error("Service health check failed");
      }
    } catch (error) {
      toast.error("Unable to connect to service");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <Toaster richColors position="top-center" closeButton duration={7000} />
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg shadow-slate-200/50 mb-6 border border-slate-200/60">
            <Download className="h-7 w-7 text-slate-700" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900 mb-3 tracking-tight">
            DownLink
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Download Your Links With Ease
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* URL Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Link className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-semibold text-slate-700">
                    Video URL
                  </label>
                </div>
                <Input
                  type="url"
                  placeholder="https://example.com/video"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-12 bg-slate-50/80 border-slate-200/60 rounded-xl text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-slate-300 transition-all duration-200"
                />
              </div>

              {/* Quality Selector */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-semibold text-slate-700">
                    Quality
                  </label>
                </div>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="h-12 bg-slate-50/80 border-slate-200/60 rounded-xl text-slate-900 focus:bg-white focus:border-slate-300 transition-all duration-200">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200/60 rounded-xl shadow-xl">
                    <SelectItem value="144p" className="rounded-lg">
                      144p
                    </SelectItem>
                    <SelectItem value="240p" className="rounded-lg">
                      240p
                    </SelectItem>
                    <SelectItem value="360p" className="rounded-lg">
                      360p
                    </SelectItem>
                    <SelectItem value="480p" className="rounded-lg">
                      480p
                    </SelectItem>
                    <SelectItem value="720p" className="rounded-lg">
                      720p (HD)
                    </SelectItem>
                    <SelectItem value="1080p" className="rounded-lg">
                      1080p (Full HD)
                    </SelectItem>
                    <SelectItem value="1440p" className="rounded-lg">
                      1440p (2K)
                    </SelectItem>
                    <SelectItem value="2160p" className="rounded-lg">
                      2160p (4K)
                    </SelectItem>
                    <SelectItem value="best" className="rounded-lg">
                      Best Available
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/25 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Start Download
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Health Check */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={checkHealth}
            className="text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-xl font-medium transition-all duration-200"
          >
            <Activity className="mr-2 h-4 w-4" />
            Check Service Status
          </Button>
        </div>
      </div>
    </div>
  );
}
