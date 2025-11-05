/**
 * API Configuration Utility
 * Handles API URL with proper formatting, HTTPS conversion, and debugging
 */

/**
 * Get the API URL from environment variables
 * Automatically converts HTTP to HTTPS when page is loaded over HTTPS (prevents mixed content errors)
 * Removes trailing slashes and ensures proper format
 * @returns {string} Formatted API URL
 */
export function getApiUrl() {
  let rawUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  // Remove trailing slash if present
  let cleanUrl = rawUrl.replace(/\/$/, "");
  
  // Auto-convert HTTP to HTTPS if page is loaded over HTTPS (prevents mixed content errors)
  const isPageHttps = window.location.protocol === "https:";
  const isApiHttp = cleanUrl.startsWith("http://");
  const isLocalhost = cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1");
  
  if (isPageHttps && isApiHttp && !isLocalhost) {
    // Convert HTTP to HTTPS for production APIs when page is HTTPS
    cleanUrl = cleanUrl.replace(/^http:/, "https:");
    console.warn("🔒 Auto-converted HTTP API URL to HTTPS to prevent mixed content error:", {
      original: rawUrl,
      converted: cleanUrl,
      reason: "Page loaded over HTTPS, API must also use HTTPS"
    });
  }
  
  // Debug logging (only in development or when explicitly enabled)
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === "true") {
    console.log("🔧 API Configuration:", {
      raw: rawUrl,
      cleaned: cleanUrl,
      env: import.meta.env.VITE_API_URL,
      mode: import.meta.env.MODE,
      pageProtocol: window.location.protocol,
      autoConverted: isPageHttps && isApiHttp && !isLocalhost
    });
  }
  
  return cleanUrl;
}

/**
 * Make a full API endpoint URL
 * @param {string} endpoint - API endpoint (e.g., "/auth/hr_login_post")
 * @returns {string} Full URL
 */
export function getApiEndpoint(endpoint) {
  const baseUrl = getApiUrl();
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

