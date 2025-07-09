# Logging Configuration

The DownLink backend uses structured logging with the Go `log/slog` package for better observability and debugging.

## Log Levels

The application supports the following log levels (in order of increasing severity):

- `DEBUG`: Detailed information for debugging
- `INFO`: General information about application flow
- `WARN`: Warning messages for potentially harmful situations
- `ERROR`: Error messages for failed operations

## Configuration

Logging can be configured using environment variables:

### LOG_LEVEL
Sets the minimum log level to display. Default: `INFO`

```bash
export LOG_LEVEL=DEBUG  # Show all logs including debug
export LOG_LEVEL=WARN   # Show only warnings and errors
export LOG_LEVEL=ERROR  # Show only errors
```

### LOG_FORMAT
Sets the log output format. Default: `json`

```bash
export LOG_FORMAT=json  # JSON structured format (default)
export LOG_FORMAT=text  # Human-readable text format
```

### LOG_BUFFER_SIZE
Sets the size of the in-memory log buffer (number of log entries). Default: `1000`

```bash
export LOG_BUFFER_SIZE=2000  # Store last 2000 log entries
```

## Log Structure

### JSON Format (Default)
```json
{
  "time": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "msg": "Video downloaded successfully",
  "url": "https://youtube.com/watch?v=example",
  "quality": "720p",
  "path": "./cache/example_720.mp4"
}
```

### Text Format
```
2024-01-15T10:30:45.123Z INFO Video downloaded successfully url=https://youtube.com/watch?v=example quality=720p path=./cache/example_720.mp4
```

## Key Log Events

### Application Startup
- Logger initialization with configuration
- Server startup with port information
- Cache directory initialization

### Video Downloads
- Download requests with URL and quality
- Cache hits and misses
- yt-dlp command execution
- Download completion or failure

### Cache Operations
- Cache cleanup scheduling and execution
- File removal operations
- Cache statistics requests

### Error Handling
- Request validation errors
- File system errors
- yt-dlp execution errors
- HTTP error responses

## Log API Endpoint

The application provides an API endpoint to retrieve logs:

```
GET /downlink/logs
```

### Query Parameters

- `level`: Filter logs by minimum level (`DEBUG`, `INFO`, `WARN`, `ERROR`). Default: `INFO`
- `limit`: Maximum number of logs to return. Default: all logs in the buffer

### Example Requests

```
GET /downlink/logs
GET /downlink/logs?level=ERROR
GET /downlink/logs?level=DEBUG&limit=50
```

### Example Response

```json
{
  "logs": [
    {
      "time": "2024-01-15T10:30:45.123Z",
      "level": "INFO",
      "msg": "Server starting",
      "attrs": {
        "port": "8080"
      }
    },
    {
      "time": "2024-01-15T10:31:10.456Z",
      "level": "INFO",
      "msg": "Video downloaded successfully",
      "attrs": {
        "url": "https://youtube.com/watch?v=example",
        "quality": "720p",
        "path": "./cache/example_720.mp4"
      }
    }
  ],
  "count": 2
}
```

## Best Practices

1. **Use appropriate log levels**: Use DEBUG for detailed troubleshooting, INFO for normal operations, WARN for potential issues, and ERROR for actual failures.

2. **Include relevant context**: Always include relevant fields like URLs, file paths, error details, and operation parameters.

3. **Avoid sensitive data**: Never log passwords, API keys, or other sensitive information.

4. **Structured logging**: Use structured fields instead of string concatenation for better parsing and filtering.

## Monitoring and Alerting

The JSON log format is compatible with log aggregation systems like:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd/Fluent Bit
- CloudWatch Logs
- Datadog
- Splunk

You can set up alerts based on ERROR level logs or specific error patterns to monitor application health.