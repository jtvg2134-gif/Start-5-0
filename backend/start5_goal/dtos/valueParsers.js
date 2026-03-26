import { createHttpError } from "../shared/errors.js";

function hasValue(value) {
  return !(value === undefined || value === null || (typeof value === "string" && value.trim() === ""));
}

export function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createHttpError(400, `${label} precisa ser um objeto JSON.`);
  }

  return value;
}

export function parseInteger(value, label, options = {}) {
  const { required = false, min = null, max = null } = options;

  if (!hasValue(value)) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw createHttpError(400, `${label} precisa ser um inteiro valido.`);
  }

  if (min !== null && parsed < min) {
    throw createHttpError(400, `${label} precisa ser maior ou igual a ${min}.`);
  }

  if (max !== null && parsed > max) {
    throw createHttpError(400, `${label} precisa ser menor ou igual a ${max}.`);
  }

  return parsed;
}

export function parseNumber(value, label, options = {}) {
  const { required = false, min = null, max = null } = options;

  if (!hasValue(value)) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw createHttpError(400, `${label} precisa ser um numero valido.`);
  }

  if (min !== null && parsed < min) {
    throw createHttpError(400, `${label} precisa ser maior ou igual a ${min}.`);
  }

  if (max !== null && parsed > max) {
    throw createHttpError(400, `${label} precisa ser menor ou igual a ${max}.`);
  }

  return parsed;
}

export function parseString(value, label, options = {}) {
  const { required = false, maxLength = null } = options;

  if (!hasValue(value)) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return null;
  }

  const parsed = String(value).trim();

  if (!parsed) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return null;
  }

  if (maxLength !== null && parsed.length > maxLength) {
    throw createHttpError(400, `${label} excede o tamanho maximo permitido.`);
  }

  return parsed;
}

export function parseEnum(value, label, allowedValues, options = {}) {
  const parsed = parseString(value, label, options);

  if (parsed === null) {
    return null;
  }

  if (!allowedValues.includes(parsed)) {
    throw createHttpError(400, `${label} precisa ser um dos valores: ${allowedValues.join(", ")}.`);
  }

  return parsed;
}

export function parseBoolean(value, label, options = {}) {
  const { required = false } = options;

  if (!hasValue(value)) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "sim", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "nao", "não", "no"].includes(normalized)) {
    return false;
  }

  throw createHttpError(400, `${label} precisa ser booleano.`);
}

export function parseArray(value, label, options = {}) {
  const { required = false } = options;

  if (!hasValue(value)) {
    if (required) {
      throw createHttpError(400, `${label} e obrigatorio.`);
    }

    return [];
  }

  if (!Array.isArray(value)) {
    throw createHttpError(400, `${label} precisa ser uma lista.`);
  }

  return value;
}
