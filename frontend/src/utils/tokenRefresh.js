import { API_BASE_URL } from "../config";

let refreshPromise = null;

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");
  if (refreshPromise) return refreshPromise;
  const refreshingAt = localStorage.getItem("tokenRefreshingAt");
  const now = Date.now();
  if (refreshingAt && now - parseInt(refreshingAt) < 5000) {
    await new Promise(r => setTimeout(r, 500));
    const newToken = localStorage.getItem("token");
    if (newToken) return newToken;
  }

  refreshPromise = (async () => {
    try {
      localStorage.setItem("tokenRefreshingAt", String(Date.now()));

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!res.ok) throw new Error("Refresh failed");

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      return data.access_token;
    } finally {
      localStorage.removeItem("tokenRefreshingAt");
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}