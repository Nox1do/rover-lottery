import { API_BASE } from "./helpers.js";
// Privileged API access stays in the userscript sandbox, never on unsafeWindow.
export function createApi({
  getToken,
  request,
  onUnauthorized = () => {},
  monotonicNow = () => performance.now(),
}) {
  const reservationClocks = new WeakMap();
  async function json(
    path,
    { auth = false, body, method = body === undefined ? "GET" : "POST" } = {},
  ) {
    if (!path.startsWith("/v1/mango/")) throw Error("unsupported_api_path");
    const token = auth ? getToken() : "";
    if (auth && !token) throw Error("token_missing");
    const started = monotonicNow();
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
    if (path === "/v1/mango/rows/reconcile" && data?.should_paint === true) {
      const headers = String(response.responseHeaders || "");
      const dates = [...headers.matchAll(/^date:[ \t]*([^\r\n]+)/gim)];
      const ages = [...headers.matchAll(/^age:[ \t]*([^\r\n]+)/gim)];
      const serverDate = dates.length === 1 ? Date.parse(dates[0][1]) : NaN;
      if (
        Number.isFinite(serverDate) &&
        ages.every((a) => a[1].trim() === "0")
      ) {
        // HTTP Date has second precision. Add that uncertainty and the entire
        // elapsed request time to avoid accepting a possibly expired lease.
        reservationClocks.set(data, { serverDate, started });
      }
    }
    return data;
  }
  return {
    get: (path, auth = false) => json(path, { auth }),
    post: (path, body) => json(path, { auth: true, body }),
    reservationNow(response) {
      const clock = reservationClocks.get(response);
      return clock
        ? clock.serverDate + 1000 + monotonicNow() - clock.started
        : NaN;
    },
  };
}
