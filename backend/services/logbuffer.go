package services

import (
	"container/ring"
	"context"
	"log/slog"
	"sync"
	"time"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Time    time.Time      `json:"time"`
	Level   string         `json:"level"`
	Message string         `json:"msg"`
	Attrs   map[string]any `json:"attrs,omitempty"`
}

// LogBuffer is a service that maintains an in-memory buffer of recent logs
type LogBuffer struct {
	buffer *ring.Ring
	mutex  sync.RWMutex
	size   int
}

// NewLogBuffer creates a new log buffer with the specified capacity
func NewLogBuffer(capacity int) *LogBuffer {
	return &LogBuffer{
		buffer: ring.New(capacity),
		size:   capacity,
	}
}

// Add adds a log entry to the buffer
func (lb *LogBuffer) Add(entry LogEntry) {
	lb.mutex.Lock()
	defer lb.mutex.Unlock()
	lb.buffer.Value = entry
	lb.buffer = lb.buffer.Next()
}

// GetEntries returns all log entries in chronological order
func (lb *LogBuffer) GetEntries() []LogEntry {
	lb.mutex.RLock()
	defer lb.mutex.RUnlock()

	var entries []LogEntry
	lb.buffer.Do(func(val interface{}) {
		if val != nil {
			entries = append(entries, val.(LogEntry))
		}
	})

	// Sort entries by time (they might be out of order due to ring buffer)
	// No need for manual sort as we'll return them in the order they appear in the ring
	return entries
}

// GetEntriesByLevel filters log entries by minimum log level
func (lb *LogBuffer) GetEntriesByLevel(minLevel slog.Level) []LogEntry {
	allEntries := lb.GetEntries()
	if minLevel == slog.LevelDebug {
		return allEntries // Return all logs if debug level requested
	}

	var filteredEntries []LogEntry
	for _, entry := range allEntries {
		var entryLevel slog.Level
		switch entry.Level {
		case "DEBUG":
			entryLevel = slog.LevelDebug
		case "INFO":
			entryLevel = slog.LevelInfo
		case "WARN":
			entryLevel = slog.LevelWarn
		case "ERROR":
			entryLevel = slog.LevelError
		}

		if entryLevel >= minLevel {
			filteredEntries = append(filteredEntries, entry)
		}
	}

	return filteredEntries
}

// Size returns the capacity of the log buffer
func (lb *LogBuffer) Size() int {
	return lb.size
}

// InMemoryHandler is a slog.Handler that writes logs to the in-memory buffer
type InMemoryHandler struct {
	logBuffer *LogBuffer
	next      slog.Handler
}

// NewInMemoryHandler creates a new slog.Handler that writes logs to both
// the in-memory buffer and the next handler
func NewInMemoryHandler(logBuffer *LogBuffer, next slog.Handler) *InMemoryHandler {
	return &InMemoryHandler{
		logBuffer: logBuffer,
		next:      next,
	}
}

// Enabled implements slog.Handler.
func (h *InMemoryHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.next.Enabled(ctx, level)
}

// Handle implements slog.Handler.
func (h *InMemoryHandler) Handle(ctx context.Context, record slog.Record) error {
	// Forward to next handler
	if err := h.next.Handle(ctx, record); err != nil {
		return err
	}

	// Store in buffer
	attrs := make(map[string]any)
	record.Attrs(func(attr slog.Attr) bool {
		attrs[attr.Key] = attr.Value.Any()
		return true
	})

	h.logBuffer.Add(LogEntry{
		Time:    record.Time,
		Level:   record.Level.String(),
		Message: record.Message,
		Attrs:   attrs,
	})

	return nil
}

// WithAttrs implements slog.Handler.
func (h *InMemoryHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return NewInMemoryHandler(h.logBuffer, h.next.WithAttrs(attrs))
}

// WithGroup implements slog.Handler.
func (h *InMemoryHandler) WithGroup(name string) slog.Handler {
	return NewInMemoryHandler(h.logBuffer, h.next.WithGroup(name))
}
