import { API_BASE } from "./helpers.js";
// Privileged API access stays in the userscript sandbox, never on unsafeWindow.
export function createApi({ getToken, request, onUnauthorized = () => {} }) {
  async function json(
    path,
    { auth = false, body, method = body === undefined ? "GET" : "POST" } = {},
  ) {
    if (!path.startsWith("/v1/mango/")) throw Error("unsupported_api_path");
    const token = auth ? getToken() : "";
    if (auth && !token) throw Error("token_missing");
    const response = await new Promise((resolve, reject) => {
      request({
        method,
        url: API_BASE + path,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(auth ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { data: JSON.stringify(body) }),
        timeout: 15000,
        onload: resolve,
        onerror: () => reject(Error("network_error")),
        ontimeout: () => reject(Error("network_timeout")),
        onabort: () => reject(Error("request_aborted")),
      });
    });
    if (auth && token !== getToken()) throw Error("token_changed");
    if (response.status === 401) onUnauthorized();
    let data;
    try {
      data = JSON.parse(response.responseText);
    } catch {
      throw Error("invalid_json_response");
    }
    if (response.status < 200 || response.status >= 300) {
      const error = Error(String(data?.error || `http_${response.status}`));
      error.status = response.status;
      throw error;
    }
    if (data?.ok === false) throw Error(String(data.error || "api_rejected"));
    return data;
  }
  return {
    get: (path, auth = false) => json(path, { auth }),
    post: (path, body) => json(path, { auth: true, body }),
  };
}
