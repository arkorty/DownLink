package main

import (
	"log/slog"
	"os"
	"strconv"

	"DownLink/services"
)

// Global log buffer for API access
var LogBuffer *services.LogBuffer

// setupLogger configures structured logging for the application
func setupLogger() {
	// Get log level from environment variable, default to INFO
	logLevel := slog.LevelInfo
	if levelStr := os.Getenv("LOG_LEVEL"); levelStr != "" {
		switch levelStr {
		case "DEBUG":
			logLevel = slog.LevelDebug
		case "INFO":
			logLevel = slog.LevelInfo
		case "WARN":
			logLevel = slog.LevelWarn
		case "ERROR":
			logLevel = slog.LevelError
		}
	}

	// Initialize log buffer (store last 1000 logs)
	bufferSize := 1000
	if sizeStr := os.Getenv("LOG_BUFFER_SIZE"); sizeStr != "" {
		if parsed, err := strconv.Atoi(sizeStr); err == nil && parsed > 0 {
			bufferSize = parsed
		}
	}
	LogBuffer = services.NewLogBuffer(bufferSize)

	// Get log format from environment variable, default to JSON
	logFormat := os.Getenv("LOG_FORMAT")
	var baseHandler slog.Handler

	if logFormat == "text" {
		baseHandler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: logLevel,
		})
	} else {
		// Default to JSON format
		baseHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: logLevel,
		})
	}

	// Wrap the base handler with in-memory handler
	handler := services.NewInMemoryHandler(LogBuffer, baseHandler)
	logger := slog.New(handler)
	slog.SetDefault(logger)

	slog.Info("Logger initialized",
		"level", logLevel.String(),
		"format", logFormat,
		"buffer_size", bufferSize,
		"service", "DownLink Backend")
}
