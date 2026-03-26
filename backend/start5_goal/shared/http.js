import { createHttpError, isHttpError } from "./errors.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, JSON_HEADERS);
  response.end(JSON.stringify(payload));
}

export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw createHttpError(400, "Corpo JSON invalido.");
  }
}

export function getRoutePath(rawPathname = "") {
  const pathname = String(rawPathname || "");

  if (pathname.startsWith("/api/start5-goal")) {
    return pathname.slice("/api/start5-goal".length) || "/";
  }

  if (pathname.startsWith("/api")) {
    return pathname.slice("/api".length) || "/";
  }

  return pathname || "/";
}

export function sendRouteError(response, error) {
  if (isHttpError(error)) {
    sendJson(response, error.status, {
      error: error.message,
      details: error.details || undefined,
    });
    return;
  }

  console.error("Start5 Goal API error:", error);
  sendJson(response, 500, { error: "Erro interno do backend Start5 Goal." });
}
