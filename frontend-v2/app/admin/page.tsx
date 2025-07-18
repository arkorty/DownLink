"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RefreshCw, Trash2, Server, FileText, Database, Loader2 } from "lucide-react"
import { getApiBaseUrl } from "../../lib/utils";
import { Toaster, toast } from "sonner";

interface CacheStatus {
  files: number;
  status: string;
  total_size: number;
}

interface LogEntry {
  time: string;
  level: string;
  msg: string;
  attrs?: Record<string, unknown>;
}

export default function AdminPage() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)

  const fetchCacheStatus = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/d/cache/status`)
      if (response.ok) {
        const data = await response.json()
        setCacheStatus(data)
      } else {
        toast.error("Failed to fetch cache status")
      }
    } catch {
      toast.error("Network error while fetching cache status")
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/d/logs`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        toast.error("Failed to fetch logs")
      }
    } catch {
      toast.error("Network error while fetching logs")
    }
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)

    try {
      await Promise.all([fetchCacheStatus(), fetchLogs()])
      toast.success("Data refreshed successfully")
    } catch {
      toast.error("Failed to refresh data")
    } finally {
      setIsLoading(false)
    }
  }, [fetchCacheStatus, fetchLogs])

  const clearCache = async () => {
    setIsClearingCache(true)
    toast.loading("Clearing cache...")

    try {
      const response = await fetch(`${getApiBaseUrl()}/d/cache/delete`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Cache cleared successfully")
        await fetchCacheStatus()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to clear cache")
      }
    } catch {
      toast.error("Network error while clearing cache")
    } finally {
      setIsClearingCache(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "bg-red-100/80 text-red-800 border-red-200/60"
      case "warn":
        return "bg-amber-100/80 text-amber-800 border-amber-200/60"
      case "info":
        return "bg-blue-100/80 text-blue-800 border-blue-200/60"
      default:
        return "bg-slate-100/80 text-slate-800 border-slate-200/60"
    }
  }

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-10 gap-4 md:gap-0">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60">
                <Server className="h-6 w-6 text-slate-700" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-slate-600 font-medium ml-0 md:ml-16 text-sm sm:text-base">Manage cache and monitor system logs</p>
          </div>
          <Button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 shadow-lg shadow-slate-200/50 rounded-xl font-medium transition-all duration-200 hover:shadow-xl w-full md:w-auto h-12"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {/* Status Message */}
        {/* Removed status message as per edit hint */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Cache Status */}
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden mb-4 md:mb-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-slate-900">
                <div className="p-2 bg-slate-100/80 rounded-lg">
                  <Database className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-base sm:text-lg">Cache Status</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-normal">Current cache information and management</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {cacheStatus ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                      <div className="text-2xl font-semibold text-slate-900 mb-1">
                        {formatFileSize(cacheStatus.total_size)}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Cache Size</div>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                      <div className="text-2xl font-semibold text-slate-900 mb-1">{cacheStatus.files}</div>
                      <div className="text-sm text-slate-600 font-medium">Files</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Status</span>
                      <Badge className={`${cacheStatus.status === "enabled" ? "bg-emerald-100/80 text-emerald-800 border-emerald-200/60" : "bg-red-100/80 text-red-800 border-red-200/60"} font-medium`}>
                        {cacheStatus.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={clearCache}
                    disabled={isClearingCache}
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-red-600/30 text-sm sm:text-base"
                  >
                    {isClearingCache ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Cache
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No cache data available.</div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-slate-900">
                <div className="p-2 bg-slate-100/80 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <div className="font-semibold text-base sm:text-lg">Logs</div>
              </CardTitle>
            </CardHeader>
            {/* CardContent is now overflow-hidden and w-full to constrain children */}
            <CardContent className="pt-0 overflow-hidden w-full">
              {/* ScrollArea is w-full, min-w-0, max-w-full to prevent overflow */}
              <ScrollArea className="h-64 sm:h-80 md:h-96 w-full min-w-0 max-w-full">
                <ScrollBar orientation="horizontal" />
                {logs.length > 0 ? (
                  // Log list is w-full, min-w-0, max-w-full
                  <ul className="space-y-2 w-full min-w-0 max-w-full">
                    {logs.map((log, idx) => (
                      // Each log entry is w-full, min-w-0, max-w-full
                      <li key={idx} className={`p-3 rounded-lg border ${getLogLevelColor(log.level)} w-full min-w-0 max-w-full`}>
                        {/* Header row: flex with min-w-0 to allow shrinking */}
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="font-mono text-xs text-slate-500 flex-shrink-0">{new Date(log.time).toLocaleString()}</span>
                          <span className="font-semibold text-xs uppercase flex-shrink-0">{log.level}</span>
                        </div>
                        {/* Log message: wraps, never overflows */}
                        <div className="mt-1 text-sm text-slate-800 break-words whitespace-pre-line w-full min-w-0 max-w-full">{log.msg}</div>
                        {/* JSON attributes: now wraps, no horizontal scroll */}
                        {log.attrs && (
                          <pre className="mt-1 text-xs text-slate-600 bg-slate-100 rounded p-2 w-full max-w-full whitespace-pre-wrap break-words break-all">{JSON.stringify(log.attrs, null, 2)}</pre>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500 text-sm">No logs available.</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <Toaster richColors position="top-center" closeButton duration={7000} />
      </div>
    </div>
    )
  }
