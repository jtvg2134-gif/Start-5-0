import path from "node:path";
import { createHttpError } from "../shared/errors.js";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function encodeStoragePath(storagePath) {
  return String(storagePath || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function slugifyFileName(fileName) {
  const parsed = path.parse(String(fileName || "").trim());
  const extension = parsed.ext ? parsed.ext.toLowerCase() : ".pdf";
  const basename = (parsed.name || "arquivo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${basename || "arquivo"}${extension}`;
}

function decodeBase64File(file) {
  const dataBase64 = String(file?.dataBase64 || "").trim();

  if (!dataBase64) {
    throw createHttpError(400, "O arquivo enviado esta vazio.");
  }

  try {
    return Buffer.from(dataBase64, "base64");
  } catch {
    throw createHttpError(400, "Nao foi possivel processar o arquivo enviado.");
  }
}

async function parseStoragePayload(response) {
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

function buildStorageHeaders(serviceKey, mimeType, extraHeaders = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  headers.set("apikey", serviceKey);

  if (mimeType) {
    headers.set("Content-Type", mimeType);
  }

  return headers;
}

export class ProofCenterStorageService {
  constructor({
    requestImpl = fetch,
    supabaseUrl = process.env.START5_PROOF_CENTER_SUPABASE_URL || process.env.SUPABASE_URL,
    serviceRoleKey =
      process.env.START5_PROOF_CENTER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket = process.env.START5_PROOF_CENTER_STORAGE_BUCKET || "proof-center-files",
  } = {}) {
    this.requestImpl = requestImpl;
    this.supabaseUrl = normalizeBaseUrl(supabaseUrl);
    this.serviceRoleKey = String(serviceRoleKey || "").trim();
    this.bucket = String(bucket || "proof-center-files").trim();
  }

  isConfigured() {
    return Boolean(this.supabaseUrl && this.serviceRoleKey && this.bucket);
  }

  ensureConfigured() {
    if (!this.isConfigured()) {
      throw createHttpError(
        503,
        "Configure START5_PROOF_CENTER_SUPABASE_URL, START5_PROOF_CENTER_SUPABASE_SERVICE_ROLE_KEY e START5_PROOF_CENTER_STORAGE_BUCKET para usar upload real no Proof Center."
      );
    }
  }

  getObjectUrl(storagePath) {
    this.ensureConfigured();
    return `${this.supabaseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodeStoragePath(storagePath)}`;
  }

  async uploadBase64File({ proofId, fileType, file, importId = null, actor = null }) {
    this.ensureConfigured();

    const fileBuffer = decodeBase64File(file);
    const safeFileName = slugifyFileName(file.fileName || file.nomeOriginal || "arquivo.pdf");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const scope = importId ? `imports/${proofId}/${importId}` : `proofs/${proofId}/${fileType}`;
    const storagePath = `${scope}/${timestamp}-${safeFileName}`;
    const mimeType = String(file.mimeType || "application/pdf").trim() || "application/pdf";

    const response = await this.requestImpl(this.getObjectUrl(storagePath), {
      method: "POST",
      headers: buildStorageHeaders(this.serviceRoleKey, mimeType, {
        "x-upsert": "true",
      }),
      body: fileBuffer,
    });

    if (!response.ok) {
      const payload = await parseStoragePayload(response);
      throw createHttpError(
        502,
        payload?.message || payload?.error || "Nao foi possivel enviar o arquivo para o Supabase Storage."
      );
    }

    return {
      nomeOriginal: String(file.fileName || file.nomeOriginal || safeFileName).trim() || safeFileName,
      tipoArquivo: String(fileType || "anexo").trim() || "anexo",
      storagePath,
      bucket: this.bucket,
      url: "",
      mimeType,
      tamanhoBytes: Number(file.sizeBytes || file.tamanhoBytes) || fileBuffer.byteLength,
      metadados: {
        storageProvider: "supabase",
        bucket: this.bucket,
        uploadedAt: new Date().toISOString(),
        uploadedByLegacyId: actor?.legacyUserId || null,
        uploadedByUuid: actor?.uuidUserId || null,
        importId: importId || null,
      },
    };
  }

  async downloadStoredFile(fileRecord) {
    this.ensureConfigured();

    const storagePath = String(fileRecord?.storagePath || "").trim();

    if (!storagePath) {
      throw createHttpError(404, "Arquivo sem caminho de storage configurado.");
    }

    const response = await this.requestImpl(this.getObjectUrl(storagePath), {
      method: "GET",
      headers: buildStorageHeaders(this.serviceRoleKey),
    });

    if (response.status === 404) {
      throw createHttpError(404, "Arquivo nao encontrado no Supabase Storage.");
    }

    if (!response.ok) {
      const payload = await parseStoragePayload(response);
      throw createHttpError(
        502,
        payload?.message || payload?.error || "Nao foi possivel baixar o arquivo do Supabase Storage."
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") || fileRecord?.mimeType || "application/octet-stream",
      contentLength: Number(response.headers.get("content-length")) || Buffer.byteLength(Buffer.from(arrayBuffer)),
      fileName: String(fileRecord?.nomeOriginal || "arquivo.pdf").trim() || "arquivo.pdf",
    };
  }

  async deleteStoredFile(storagePath) {
    this.ensureConfigured();

    if (!String(storagePath || "").trim()) {
      return;
    }

    const response = await this.requestImpl(this.getObjectUrl(storagePath), {
      method: "DELETE",
      headers: buildStorageHeaders(this.serviceRoleKey),
    });

    if (!response.ok && response.status !== 404) {
      const payload = await parseStoragePayload(response);
      throw createHttpError(
        502,
        payload?.message || payload?.error || "Nao foi possivel remover o arquivo anterior do Supabase Storage."
      );
    }
  }
}
