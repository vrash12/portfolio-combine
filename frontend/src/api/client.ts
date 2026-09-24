import axios from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://api.vrmsuliva.online"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

export const AUTH_UNAUTHORIZED_EVENT = "portfolio:unauthorized";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export function getImageUrl(image?: string | null) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  if (image.startsWith("/static")) {
    return `${API_BASE_URL}${image}`;
  }

  return `${API_BASE_URL}/static/images/${image}`;
}

export function getThumbnailUrl(
  image?: string | null,
  width = 900
) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  const filename = image.split("/").filter(Boolean).pop();

  if (!filename) return getImageUrl(image);

  const normalizedWidth = Math.min(
    1600,
    Math.max(320, Math.round(width))
  );

  return `${API_BASE_URL}/static/thumbnails/${encodeURIComponent(
    filename
  )}?w=${normalizedWidth}`;
}
