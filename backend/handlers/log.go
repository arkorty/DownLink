package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"DownLink/services"
)

// LogHandler handles requests for viewing logs
type LogHandler struct {
	logBuffer *services.LogBuffer
}

// NewLogHandler creates a new log handler with the provided log buffer
func NewLogHandler(logBuffer *services.LogBuffer) *LogHandler {
	return &LogHandler{
		logBuffer: logBuffer,
	}
}

// GetLogs returns the logs based on query parameters
func (lh *LogHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	slog.Debug("Log retrieval requested", "remote_addr", r.RemoteAddr)

	// Parse level parameter
	level := slog.LevelInfo
	if levelStr := r.URL.Query().Get("level"); levelStr != "" {
		switch levelStr {
		case "DEBUG", "debug":
			level = slog.LevelDebug
		case "INFO", "info":
			level = slog.LevelInfo
		case "WARN", "warn":
			level = slog.LevelWarn
		case "ERROR", "error":
			level = slog.LevelError
		}
	}

	// Parse limit parameter
	limit := 0 // 0 means no limit
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get logs filtered by level
	logs := lh.logBuffer.GetEntriesByLevel(level)

	// Apply limit if specified
	if limit > 0 && limit < len(logs) {
		// Return the most recent logs (which are at the end of the array)
		startIdx := len(logs) - limit
		if startIdx < 0 {
			startIdx = 0
		}
		logs = logs[startIdx:]
	}

	// Respond with logs
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	slog.Debug("Returning logs", "count", len(logs), "level", level.String())
	json.NewEncoder(w).Encode(map[string]interface{}{
		"logs":  logs,
		"count": len(logs),
	})
}
