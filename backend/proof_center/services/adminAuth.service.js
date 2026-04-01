import { createHttpError } from "../shared/errors.js";

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function parseLegacyUserId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOrigin(value, fallback = "") {
  const normalized = String(value || fallback || "").trim().replace(/\/+$/, "");
  return normalized;
}

function sanitizePayloadError(payload, fallbackMessage) {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return fallbackMessage;
}

async function parseJsonSafely(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export class ProofCenterAdminAuthService {
  constructor({ requestImpl = fetch, legacyApiOrigin } = {}) {
    this.requestImpl = requestImpl;
    this.legacyApiOrigin = normalizeOrigin(
      legacyApiOrigin,
      process.env.START5_PROOF_CENTER_LEGACY_API_ORIGIN ||
        process.env.START5_PUBLIC_ORIGIN ||
        "http://localhost:3000"
    );
  }

  getLegacyMeUrl() {
    if (!this.legacyApiOrigin) {
      throw createHttpError(
        500,
        "Defina START5_PROOF_CENTER_LEGACY_API_ORIGIN ou START5_PUBLIC_ORIGIN para validar o admin no backend Proof Center."
      );
    }

    return `${this.legacyApiOrigin}/api/auth/me`;
  }

  async getAdminContext(request) {
    const cookieHeader = String(request.headers.cookie || "").trim();

    if (!cookieHeader) {
      throw createHttpError(401, "Sua sessao expirou. Entre novamente para continuar no admin.");
    }

    let response;

    try {
      response = await this.requestImpl(this.getLegacyMeUrl(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: cookieHeader,
          "User-Agent": request.headers["user-agent"] || "start5-proof-center-api",
          "X-Forwarded-For": request.socket?.remoteAddress || "",
        },
      });
    } catch (error) {
      throw createHttpError(
        503,
        "Nao foi possivel validar a sessao administrativa no servidor principal do Start 5.",
        { cause: error instanceof Error ? error.message : String(error || "") }
      );
    }

    const payload = await parseJsonSafely(response);

    if (response.status === 401) {
      throw createHttpError(401, "Sua sessao expirou. Entre novamente para continuar no admin.");
    }

    if (!response.ok) {
      throw createHttpError(
        503,
        sanitizePayloadError(payload, "Nao foi possivel validar a sessao administrativa no Start 5.")
      );
    }

    const user = payload?.user || null;

    if (!user) {
      throw createHttpError(401, "Nao foi possivel identificar o usuario autenticado.");
    }

    const headerUserId =
      request.headers["x-start5-user-id"] ||
      request.headers["x-user-id"] ||
      request.headers["x-admin-id"] ||
      "";
    const normalizedHeaderUserId = String(Array.isArray(headerUserId) ? headerUserId[0] : headerUserId || "").trim();

    return {
      user,
      actor: {
        uuidUserId: isUuid(normalizedHeaderUserId) ? normalizedHeaderUserId : null,
        legacyUserId: parseLegacyUserId(user.id),
      },
      permissions: {
        canAccessAdmin: Boolean(user?.permissions?.canAccessAdmin || user?.role === "admin"),
        canManageAdmins: Boolean(user?.permissions?.canManageAdmins || user?.adminCanManageAdmins),
        isPrimaryAdmin: Boolean(user?.permissions?.isPrimaryAdmin || user?.isPrimaryAdmin),
      },
    };
  }

  async requireAdmin(request) {
    const context = await this.getAdminContext(request);

    if (!context.permissions.canAccessAdmin) {
      throw createHttpError(403, "Acesso restrito ao admin.");
    }

    return context;
  }
}
