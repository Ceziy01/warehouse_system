import { API_BASE_URL } from "../config";
import { refreshAccessToken } from "./tokenRefresh";

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  
  const makeRequest = (accessToken) => {
    const isFormData = options.body instanceof FormData;
    
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    
    return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await makeRequest(newToken);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new CustomEvent("unauthorized"));
      throw new Error("Session expired");
    }
  }

  return response;
}