import { API_BASE_URL } from "../config";

let refreshPromise = null;

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
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
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}