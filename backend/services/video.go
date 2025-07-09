package services

import (
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type VideoService struct {
	cacheDir string
}

func NewVideoService() *VideoService {
	// Create cache directory if it doesn't exist
	cacheDir := "./cache"
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		slog.Error("Failed to create cache directory", "path", cacheDir, "error", err)
		cacheDir = "" // Disable caching if we can't create directory
		slog.Warn("Caching disabled due to directory creation failure")
	} else {
		slog.Info("Cache directory initialized", "path", cacheDir)
	}

	return &VideoService{
		cacheDir: cacheDir,
	}
}

func (vs *VideoService) extractWatchID(url string) string {
	// YouTube watch ID pattern
	youtubePattern := regexp.MustCompile(`(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})`)
	if match := youtubePattern.FindStringSubmatch(url); len(match) > 1 {
		return match[1]
	}

	// Instagram pattern
	instagramPattern := regexp.MustCompile(`instagram\.com/p/([a-zA-Z0-9_-]+)`)
	if match := instagramPattern.FindStringSubmatch(url); len(match) > 1 {
		return match[1]
	}

	// Fallback: use a hash of the URL
	return fmt.Sprintf("hash_%x", len(url))
}

func (vs *VideoService) generateCacheFileName(url, quality string) string {
	watchID := vs.extractWatchID(url)
	// Remove 'p' from quality (e.g., "720p" -> "720")
	cleanQuality := strings.TrimSuffix(quality, "p")
	return fmt.Sprintf("%s_%s.mp4", watchID, cleanQuality)
}

func (vs *VideoService) DownloadVideo(url, quality string) (string, error) {
	// Check cache first
	if vs.cacheDir != "" {
		cacheFileName := vs.generateCacheFileName(url, quality)
		cachePath := filepath.Join(vs.cacheDir, cacheFileName)
		
		// Check if cached file exists
		if _, err := os.Stat(cachePath); err == nil {
			slog.Info("Cache hit", "url", url, "quality", quality, "file", cachePath)
			return cachePath, nil
		}
	}

	slog.Info("Cache miss, downloading video", "url", url, "quality", quality)

	// Determine output path
	var outputPath string

	if vs.cacheDir != "" {
		// Use cache directory with watch_id+quality naming
		cacheFileName := vs.generateCacheFileName(url, quality)
		outputPath = filepath.Join(vs.cacheDir, cacheFileName)
	} else {
		// Fallback to temporary directory
		tmpDir, err := os.MkdirTemp("", "dl_")
		if err != nil {
			return "", fmt.Errorf("failed to create temporary directory: %v", err)
		}
		watchID := vs.extractWatchID(url)
		cleanQuality := strings.TrimSuffix(quality, "p")
		outputPath = filepath.Join(tmpDir, fmt.Sprintf("%s_%s.mp4", watchID, cleanQuality))
	}

	quality = quality[:len(quality)-1]

	var mergedFormat string
	var cookies string

	if strings.Contains(url, "instagram.com/") {
		mergedFormat = fmt.Sprintf("bestvideo[width<=%s]+bestaudio/best", quality)
		cookies = "instagram.txt"
	} else {
		mergedFormat = fmt.Sprintf("bestvideo[height<=%s]+bestaudio/best[height<=%s]", quality, quality)
		cookies = "youtube.txt"
	}

	cookiePath := filepath.Join(".", cookies)
	if _, err := os.Stat(cookiePath); os.IsNotExist(err) {
		slog.Error("Cookie file not found", "path", cookiePath)
		return "", fmt.Errorf("cookie file %s not found", cookiePath)
	}

	slog.Info("Starting yt-dlp download", 
		"url", url, 
		"quality", quality, 
		"format", mergedFormat, 
		"cookies", cookiePath,
		"output", outputPath)

	cmdDownload := exec.Command("./venv/bin/python3", "-m", "yt_dlp", "--cookies", cookiePath, "-f", mergedFormat, "--merge-output-format", "mp4", "-o", outputPath, url)

	output, err := cmdDownload.CombinedOutput()
	if err != nil {
		slog.Error("yt-dlp download failed", 
			"url", url, 
			"error", err, 
			"output", string(output))
		return "", fmt.Errorf("failed to download video and audio: %v\nOutput: %s", err, string(output))
	}

	slog.Info("yt-dlp download completed", "url", url, "output", string(output))

	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		slog.Error("Output file was not created", "path", outputPath)
		return "", fmt.Errorf("video file was not created")
	}

	slog.Info("Video downloaded successfully", "path", outputPath)
	return outputPath, nil
}

func (vs *VideoService) CleanupTempDir(path string) {
	// Only cleanup if it's a temporary download (contains "dl_" in path)
	if strings.Contains(path, "dl_") {
		dir := filepath.Dir(path)
		if err := os.RemoveAll(dir); err != nil {
			slog.Error("Failed to clean up temporary directory", "path", dir, "error", err)
		} else {
			slog.Info("Temporary directory cleaned up", "path", dir)
		}
	}
}

// CleanupExpiredCache removes cached files that are older than the specified duration
func (vs *VideoService) CleanupExpiredCache(maxAge time.Duration) error {
	if vs.cacheDir == "" {
		slog.Debug("Cache cleanup skipped - caching disabled")
		return nil
	}

	files, err := os.ReadDir(vs.cacheDir)
	if err != nil {
		return fmt.Errorf("failed to read cache directory: %v", err)
	}

	cutoff := time.Now().Add(-maxAge)
	var removedCount int
	var totalSize int64

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".mp4") {
			continue
		}

		filePath := filepath.Join(vs.cacheDir, file.Name())
		info, err := os.Stat(filePath)
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			if err := os.Remove(filePath); err != nil {
				slog.Error("Failed to remove expired cache file", "path", filePath, "error", err)
			} else {
				removedCount++
				totalSize += info.Size()
				slog.Debug("Removed expired cache file", "path", filePath, "size", info.Size())
			}
		}
	}

	if removedCount > 0 {
		slog.Info("Cache cleanup completed", "files_removed", removedCount, "total_size_removed", totalSize)
	} else {
		slog.Debug("Cache cleanup completed - no expired files found")
	}

	return nil
}

// GetCacheDir returns the cache directory path
func (vs *VideoService) GetCacheDir() string {
	return vs.cacheDir
}

// GetCacheStats returns cache statistics
func (vs *VideoService) GetCacheStats() map[string]interface{} {
	if vs.cacheDir == "" {
		return map[string]interface{}{
			"status": "disabled",
			"total_size": 0,
			"files": 0,
		}
	}

	files, err := os.ReadDir(vs.cacheDir)
	if err != nil {
		slog.Error("Failed to read cache directory for stats", "path", vs.cacheDir, "error", err)
		return map[string]interface{}{
			"status": "error",
			"total_size": 0,
			"files": 0,
		}
	}

	var videoCount int64
	var totalSize int64

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".mp4") {
			continue
		}

		filePath := filepath.Join(vs.cacheDir, file.Name())
		info, err := os.Stat(filePath)
		if err != nil {
			continue
		}

		videoCount++
		totalSize += info.Size()
	}

	// Convert bytes to MB
	totalSizeMB := totalSize

	return map[string]interface{}{
		"status": "enabled",
		"total_size": totalSizeMB,
		"files": videoCount,
	}
}
