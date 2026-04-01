import http from "node:http";
import { query, withTransaction } from "./db/connection.js";
import { ProofCenterAdminController } from "./controllers/proofCenterAdmin.controller.js";
import { ProofCenterAdminRepository } from "./repositories/proofCenterAdmin.repository.js";
import { buildProofCenterRoutes } from "./routes/proofCenter.routes.js";
import { ProofCenterAdminAuthService } from "./services/adminAuth.service.js";
import { ProofCenterPdfAnalysisService } from "./services/pdfAnalysis.service.js";
import { ProofCenterStorageService } from "./services/storage.service.js";
import { getRoutePath, sendJson, sendRouteError } from "./shared/http.js";

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function resolveCorsOrigin(request) {
  const configuredOrigin = String(process.env.START5_PROOF_CENTER_CORS_ORIGIN || "").trim();

  if (configuredOrigin && configuredOrigin !== "*") {
    return configuredOrigin;
  }

  return String(request.headers.origin || configuredOrigin || "http://localhost:3000").trim();
}

function applyCors(request, response) {
  response.setHeader("Access-Control-Allow-Origin", resolveCorsOrigin(request));
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Start5-User-Id, X-User-Id, X-Admin-Id");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.setHeader("Vary", "Origin");
}

function resolveRoute(routes, method, path) {
  return routes.find((candidate) => {
    if (candidate.method !== method) {
      return false;
    }

    if (candidate.path) {
      return candidate.path === path;
    }

    return Boolean(path.match(candidate.pattern));
  });
}

const db = { query, withTransaction };
const adminAuthService = new ProofCenterAdminAuthService();
const storageService = new ProofCenterStorageService();
const pdfAnalysisService = new ProofCenterPdfAnalysisService();
const proofCenterAdminRepository = new ProofCenterAdminRepository({ db, storageService, pdfAnalysisService });
const proofCenterAdminController = new ProofCenterAdminController({ proofCenterAdminRepository });
const routes = buildProofCenterRoutes({ proofCenterAdminController });

const server = http.createServer(async (request, response) => {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const path = normalizePath(getRoutePath(url.pathname));

  if (request.method === "GET" && path === "/health") {
    sendJson(response, 200, { ok: true, service: "start5-proof-center-api" });
    return;
  }

  const route = resolveRoute(routes, request.method, path);

  if (!route) {
    sendJson(response, 404, { error: "Rota Proof Center nao encontrada." });
    return;
  }

  try {
    const match = route.pattern ? path.match(route.pattern) : null;
    const adminContext = await adminAuthService.requireAdmin(request);
    await route.handler({ request, response, url, path, adminContext }, match);
  } catch (error) {
    sendRouteError(response, error);
  }
});

const port = Number(process.env.START5_PROOF_CENTER_PORT || process.env.PORT || 3030);

server.listen(port, () => {
  console.log(`Start5 Proof Center API rodando em http://localhost:${port}`);
});
