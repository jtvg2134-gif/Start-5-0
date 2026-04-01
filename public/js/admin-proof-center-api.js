(function initializeStart5ProofCenterApi() {
  function normalizeApiError(payload, fallbackMessage) {
    if (!payload) {
      return fallbackMessage;
    }

    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }

    return fallbackMessage;
  }

  function getConfiguredBase() {
    const bodyBase = document.body?.dataset?.proofCenterApiBase || "";
    const metaBase =
      document.querySelector('meta[name="start5-proof-center-api-base"]')?.getAttribute("content") || "";
    const runtimeBase = window.START5_PROOF_CENTER_API_BASE || "";

    return String(runtimeBase || bodyBase || metaBase || "").trim().replace(/\/+$/, "");
  }

  function mapPath(path) {
    const configuredBase = getConfiguredBase();

    if (!configuredBase) {
      return path;
    }

    const normalizedPath = String(path || "").trim();
    const adminPrefix = "/api/admin/proof-center";
    const servicePrefix = "/proof-center";

    if (normalizedPath.startsWith(adminPrefix)) {
      return `${configuredBase}${servicePrefix}${normalizedPath.slice(adminPrefix.length)}`;
    }

    if (normalizedPath.startsWith(servicePrefix)) {
      return `${configuredBase}${normalizedPath}`;
    }

    if (normalizedPath.startsWith("/api/start5-proof-center")) {
      return `${configuredBase}${normalizedPath.slice("/api/start5-proof-center".length) || "/"}`;
    }

    return `${configuredBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  }

  async function request(path, options = {}) {
    const configuredBase = getConfiguredBase();

    if (!configuredBase && window.Start5Auth?.apiRequest) {
      return window.Start5Auth.apiRequest(path, options);
    }

    const nextOptions = { ...options };
    const headers = new Headers(nextOptions.headers || {});

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (
      nextOptions.body &&
      typeof nextOptions.body === "object" &&
      !(nextOptions.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
      nextOptions.body = JSON.stringify(nextOptions.body);
    } else if (typeof nextOptions.body === "string" && nextOptions.body.trim() && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const session = window.Start5Auth?.getSession?.() || null;

    if (session?.id && !headers.has("X-Start5-User-Id")) {
      headers.set("X-Start5-User-Id", String(session.id));
    }

    let response;

    try {
      response = await fetch(mapPath(path), {
        credentials: "include",
        ...nextOptions,
        headers,
      });
    } catch (error) {
      const networkError = new Error("Nao foi possivel conectar ao backend do modulo de provas.");
      networkError.cause = error;
      throw networkError;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(
        normalizeApiError(payload, "Nao foi possivel concluir a requisicao do modulo de provas.")
      );
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  window.Start5ProofCenterApi = {
    getBase: getConfiguredBase,
    mapPath,
    request,
  };
})();
