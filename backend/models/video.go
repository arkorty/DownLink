package models

type VideoDownloadRequest struct {
	URL     string `json:"url"`
	Quality string `json:"quality"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
