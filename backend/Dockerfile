# Builder stage
FROM golang:1.21-alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /build

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the Go app
RUN go build -o main .

# Runtime stage
FROM alpine:3.17

WORKDIR /app

# Copy the executable from builder
COPY --from=builder /build/main .
COPY --from=builder /build/*txt .

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg

# Create a virtual environment for Python
RUN python3 -m venv venv

# Activate the virtual environment and install yt-dlp
RUN ./venv/bin/pip install --upgrade pip && \
    ./venv/bin/pip install yt-dlp

# Ensure ffmpeg is in the PATH
ENV PATH="/usr/bin:${PATH}"

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
