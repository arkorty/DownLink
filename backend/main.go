package main

import (
	"log"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"DownLink/handlers"
	"DownLink/services"
)

func main() {
	// Setup structured logging
	setupLogger()

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://downlink.webark.in"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Initialize services
	videoService := services.NewVideoService()

	// Initialize handlers
	videoHandler := handlers.NewVideoHandler(videoService)
	logHandler := handlers.NewLogHandler(LogBuffer) // Initialize log handler

	// Routes
	r.Get("/d/", videoHandler.HealthCheck)
	r.Post("/d/download", videoHandler.DownloadVideo)
	r.Get("/d/cache/status", videoHandler.GetCacheStatus)
	r.Delete("/d/cache/delete", videoHandler.ClearCache)
	r.Get("/d/logs", logHandler.GetLogs)

	// Start periodic cache cleanup (every 6 hours)
	go func() {
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			if err := videoService.CleanupExpiredCache(24 * time.Hour); err != nil {
				slog.Error("Cache cleanup failed", "error", err)
			} else {
				slog.Info("Cache cleanup completed successfully")
			}
		}
	}()

	slog.Info("Server starting", "port", "8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
