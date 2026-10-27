const BASE = "/api/loteria/resultadosLoteria2";
// This wrapper returns the ORIGINAL promise and never changes arguments or response.
// Only known same-origin reads are cloned. No cookies/tokens are copied into messages.
export function installNativeObserver(page, exportToPage, notify) {
  const original = page.fetch;
  let sequence = 0;
  if (typeof original !== "function") return false;
  const report = (event) => {
    try {
      notify(event);
    } catch {
      /* Observation must never break Central. */
    }
  };
  function observe(input, options) {
    let meta;
    try {
      const url = new URL(
        typeof input === "string" ? input : input.url,
        page.location.href,
      );
      const origin = new URL(page.location.href).origin;
      const kind =
        url.pathname === BASE
          ? "main"
          : url.pathname === BASE + "/dependientes"
            ? "rules"
            : url.pathname === BASE + "/revision"
              ? "revision"
              : url.pathname === BASE + "/procesar"
                ? "publishing"
                : null;
      if (url.origin === origin && kind) {
        const method = String(
          options?.method || input?.method || "GET",
        ).toUpperCase();
        const body =
          typeof options?.body === "string" ? JSON.parse(options.body) : null;
        const headers = new Headers(options?.headers || input?.headers || {});
        meta = {
          id: ++sequence,
          kind,
          date: body?.fecha || url.searchParams.get("fecha"),
          serverId: headers.get("X-Servidor") || "",
          method,
        };
        report({ type: "start", ...meta });
      }
    } catch {
      /* Unrecognized calls remain untouched. */
    }
    let result;
    try {
      result = Reflect.apply(original, this, arguments);
    } catch (error) {
      if (meta) report({ type: "failure", ...meta });
      throw error;
    }
    if (meta) {
      // Attach directly: Promise.resolve(foreignPromise) delays attachment until
      // after Central's consumer, which may already have consumed the body.
      // Export non-async callbacks so no sandbox Promise is returned to the page.
      try {
        result.then(
          exportToPage((response) => {
            try {
              if (!response.ok) throw new Error("native_http_error");
              if (meta.kind === "publishing") {
                report({ type: "success", ...meta });
                return;
              }
              const clone = response.clone();
              void (async () => {
                try {
                  const text = await clone.text();
                  if (text.length > 4_000_000)
                    throw new Error("native_payload_too_large");
                  const data = JSON.parse(text);
                  report({ type: "success", ...meta, data });
                } catch {
                  report({ type: "failure", ...meta });
                }
              })();
            } catch {
              report({ type: "failure", ...meta });
            }
          }, page),
          exportToPage(() => report({ type: "failure", ...meta }), page),
        );
      } catch {
        report({ type: "failure", ...meta });
      }
    }
    return result;
  }
  try {
    page.fetch = exportToPage(observe, page);
    return page.fetch !== original;
  } catch {
    return false;
  }
}
