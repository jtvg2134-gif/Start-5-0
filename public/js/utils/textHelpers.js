export function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clamp(value, minimum, maximum) {
  const safeValue = Number(value) || 0;
  return Math.min(maximum, Math.max(minimum, safeValue));
}

export function formatMinutes(value) {
  return `${new Intl.NumberFormat("pt-BR").format(Math.round(Number(value) || 0))} min`;
}

export function formatDateLabel(value) {
  const safeDate = new Date(`${String(value || "").trim()}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return "--";
  }

  return safeDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function slugify(value) {
  return normalizeForSearch(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function sentenceCase(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return "";
  }

  return cleanValue.slice(0, 1).toUpperCase() + cleanValue.slice(1);
}
