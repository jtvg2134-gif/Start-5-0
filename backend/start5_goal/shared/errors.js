export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.status = Number(status) || 500;
    this.details = details;
  }
}

export function createHttpError(status, message, details = null) {
  return new HttpError(status, message, details);
}

export function isHttpError(error) {
  return error instanceof HttpError;
}
