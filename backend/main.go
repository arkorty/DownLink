package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/google/uuid"
)

// VideoDownloadRequest represents the request structure for video download
type VideoDownloadRequest struct {
	URL     string `json:"url"`
	Quality string `json:"quality"`
}

func downloadVideo(c echo.Context) error {
    req := new(VideoDownloadRequest)
    if err := c.Bind(req); err != nil {
        return err
    }
    if req.URL == "" || req.Quality == "" {
        return echo.NewHTTPError(http.StatusBadRequest, "URL and Quality are required")
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
    outputPath := filepath.Join(tmpDir, fmt.Sprintf("output_%s.mp4", uid))

    // Download video and audio combined
    quality := req.Quality[:len(req.Quality) - 1]
    mergedFormat := fmt.Sprintf("bestvideo[height<=%s]+bestaudio/best[height<=%s]", quality, quality)
    cmdDownload := exec.Command("./venv/bin/python3", "-m", "yt_dlp", "--cookies", "cookies.txt", "-f", mergedFormat, "--merge-output-format", "mp4", "-o", outputPath, req.URL)
    if err := cmdDownload.Run(); err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to download video and audio: %v", err))
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
