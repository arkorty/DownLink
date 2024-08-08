package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/google/uuid"
)

// VideoDownloadRequest represents the request structure for video download
type VideoDownloadRequest struct {
	URL     string `json:"url"`
	Quality string `json:"quality"`
}

// getBestFormat fetches and returns the best format for the given quality
func getBestFormats(url string, targetResolution string) (string, string, error) {
    log.Printf("Getting best formats for URL: %s, target resolution: %s", url, targetResolution)

    cmd := exec.Command("yt-dlp", "--cookies", "cookies.txt", "--list-formats", url)
    output, err := cmd.CombinedOutput()
    if err != nil {
        return "", "", fmt.Errorf("failed to list formats: %v\nOutput: %s", err, string(output))
    }

    lines := strings.Split(strings.TrimSpace(string(output)), "\n")
    var bestVideoFormat, bestAudioFormat string
    targetHeight := strings.TrimSuffix(targetResolution, "p")

    for _, line := range lines {
        fields := strings.Fields(line)
        if len(fields) < 3 {
            continue
        }

        if strings.Contains(line, targetHeight) && strings.Contains(line, "mp4") && bestVideoFormat == "" {
            bestVideoFormat = fields[0]
        }

        if strings.Contains(line, "audio only") && strings.Contains(line, "m4a") && bestAudioFormat == "" {
            bestAudioFormat = fields[0]
        }

        if bestVideoFormat != "" && bestAudioFormat != "" {
            break
        }
    }

    if bestVideoFormat == "" || bestAudioFormat == "" {
        return "", "", fmt.Errorf("no suitable formats found for resolution: %s", targetResolution)
    }

    log.Printf("Selected video format: %s, audio format: %s", bestVideoFormat, bestAudioFormat)
    return bestVideoFormat, bestAudioFormat, nil
}

func downloadVideo(c echo.Context) error {
    req := new(VideoDownloadRequest)
    if err := c.Bind(req); err != nil {
        return err
    }
    if req.URL == "" || req.Quality == "" {
        return echo.NewHTTPError(http.StatusBadRequest, "URL and Quality are required")
    }

    // Get the best video and audio formats
    videoFormat, audioFormat, err := getBestFormats(req.URL, req.Quality)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to get best formats: %v", err))
    }

    // Create a temporary directory for downloading files
    tmpDir, err := os.MkdirTemp("", "downlink")
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to create temporary directory: %v", err))
    }
    defer func() {
        if err := os.RemoveAll(tmpDir); err != nil {
            log.Printf("Failed to clean up temporary directory: %v", err)
        }
    }()

    uid := uuid.New().String()
    videoPath := filepath.Join(tmpDir, fmt.Sprintf("video_%s.mp4", uid))
    audioPath := filepath.Join(tmpDir, fmt.Sprintf("audio_%s.m4a", uid))
    outputPath := filepath.Join(tmpDir, fmt.Sprintf("output_%s.mp4", uid))

    // Download video
    cmdVideo := exec.Command("yt-dlp", "--cookies", "cookies.txt", "-f", videoFormat, "-o", videoPath, req.URL)
    if err := cmdVideo.Run(); err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to download video: %v", err))
    }

    // Download audio
    cmdAudio := exec.Command("yt-dlp", "--cookies", "cookies.txt", "-f", audioFormat, "-o", audioPath, req.URL)
    if err := cmdAudio.Run(); err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to download audio: %v", err))
    }

    // Combine video and audio using ffmpeg
    cmdMerge := exec.Command("ffmpeg", "-i", videoPath, "-i", audioPath, "-c", "copy", outputPath)
    if err := cmdMerge.Run(); err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to merge video and audio: %v", err))
    }

    // Serve the file with appropriate headers
    return c.Attachment(outputPath, fmt.Sprintf("video_%s.mp4", uid))
}

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
	}))

	// Routes
	e.GET("/downlink/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Backend for DownLink is running.\n")
	})

	e.POST("/downlink/download", downloadVideo)

	// Start server
	e.Logger.Fatal(e.Start(":8080"))
}
