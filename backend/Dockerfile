# Use the official Golang image
FROM golang:1.20-alpine

# Set the Current Working Directory inside the container
WORKDIR /server

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the Go app
RUN go build -o main .

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
