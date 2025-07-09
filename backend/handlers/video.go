package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"DownLink/models"
	"DownLink/services"

	"github.com/google/uuid"
)

type VideoHandler struct {
	videoService *services.VideoService
}

func NewVideoHandler(videoService *services.VideoService) *VideoHandler {
	return &VideoHandler{
		videoService: videoService,
	}
}

func (vh *VideoHandler) DownloadVideo(w http.ResponseWriter, r *http.Request) {
	var req models.VideoDownloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Failed to decode request body", "error", err)
		vh.writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.URL == "" || req.Quality == "" {
		slog.Warn("Invalid request parameters", "url", req.URL, "quality", req.Quality)
		vh.writeError(w, http.StatusBadRequest, "URL and Quality are required")
		return
	}

	slog.Info("Starting video download", "url", req.URL, "quality", req.Quality)

	outputPath, err := vh.videoService.DownloadVideo(req.URL, req.Quality)
	if err != nil {
		slog.Error("Video download failed", "url", req.URL, "quality", req.Quality, "error", err)
		vh.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Determine if this was a cached response
	isCached := !strings.Contains(outputPath, "dl_") && strings.Contains(outputPath, "cache")

	// Only cleanup if it's a fresh download (not cached)
	if strings.Contains(outputPath, "dl_") {
		defer vh.videoService.CleanupTempDir(outputPath)
	}

	uid := uuid.New().String()
	filename := fmt.Sprintf("video_%s.mp4", uid)

	// Add cache status header
	if isCached {
		w.Header().Set("X-Cache-Status", "HIT")
		slog.Info("Serving cached video", "url", req.URL, "quality", req.Quality, "file", outputPath)
	} else {
		w.Header().Set("X-Cache-Status", "MISS")
		slog.Info("Serving fresh download", "url", req.URL, "quality", req.Quality, "file", outputPath)
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	w.Header().Set("Content-Type", "video/mp4")

	http.ServeFile(w, r, outputPath)
}

func (vh *VideoHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	slog.Debug("Health check requested", "remote_addr", r.RemoteAddr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Backend for DownLink is running.\n"))
}

func (vh *VideoHandler) ClearCache(w http.ResponseWriter, r *http.Request) {
	slog.Info("Cache clear requested")
	if err := vh.videoService.CleanupExpiredCache(0); err != nil {
		slog.Error("Failed to clear cache", "error", err)
		vh.writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to clear cache: %v", err))
		return
	}

	slog.Info("Cache cleared successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Cache cleared successfully"})
}

func (vh *VideoHandler) GetCacheStatus(w http.ResponseWriter, r *http.Request) {
	slog.Debug("Cache status requested")
	status := vh.videoService.GetCacheStats()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func (vh *VideoHandler) writeError(w http.ResponseWriter, status int, message string) {
	slog.Error("HTTP error response", "status", status, "message", message)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{Error: message})
}
