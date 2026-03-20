import { promises as fs } from "node:fs";
import path from "node:path";

function toPosixPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function buildItemKey({ ano = 0, dia = 0, caderno = "" } = {}) {
  const safeYear = Number(ano) || 0;
  const safeDay = Number(dia) || 0;
  const safeBooklet = String(caderno || "").trim().toUpperCase();

  if (!safeYear || !safeDay || !safeBooklet) {
    return "";
  }

  return `${safeYear}:D${safeDay}:${safeBooklet}`;
}

async function readJsonFile(filePath, fallbackValue = null) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT" && fallbackValue !== null) {
      return fallbackValue;
    }

    throw new Error(`Nao foi possivel ler ${filePath}: ${error.message}`);
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeOverrideEntry(entry = {}) {
  const match = entry.match || {};
  const key = buildItemKey(match);

  if (!key) {
    return null;
  }

  const ignoreReport = entry.ignoreReport || {};

  return {
    key,
    match: {
      ano: Number(match.ano) || 0,
      dia: Number(match.dia) || 0,
      caderno: String(match.caderno || "").trim().toUpperCase(),
    },
    status: String(entry.status || "").trim() || null,
    notes: normalizeStringArray(entry.notes),
    tags: normalizeStringArray(entry.tags),
    ignoreReport: {
      duplicateKeys: normalizeStringArray(ignoreReport.duplicateKeys),
      ambiguousKeys: normalizeStringArray(ignoreReport.ambiguousKeys),
      folderConflictFiles: normalizeStringArray(ignoreReport.folderConflictFiles),
      missingPairKeys: normalizeStringArray(ignoreReport.missingPairKeys),
      suspiciousKeys: normalizeStringArray(ignoreReport.suspiciousKeys),
    },
  };
}

function indexOverrides(overridesDocument = {}) {
  const entries = Array.isArray(overridesDocument.entries) ? overridesDocument.entries : [];
  const indexed = new Map();

  entries.forEach((rawEntry) => {
    const normalized = normalizeOverrideEntry(rawEntry);

    if (!normalized) {
      return;
    }

    indexed.set(normalized.key, normalized);
  });

  return indexed;
}

function filterIssueBuckets(report = {}, overridesIndex = new Map()) {
  const active = cloneJson(report);
  const resolved = {
    duplicates: [],
    ambiguous_items: [],
    folder_conflicts: [],
    missing_pairs: [],
    suspicious_items: [],
  };

  const ignoredDuplicateKeys = new Set();
  const ignoredAmbiguousKeys = new Set();
  const ignoredFolderConflictFiles = new Set();
  const ignoredMissingPairKeys = new Set();
  const ignoredSuspiciousKeys = new Set();

  overridesIndex.forEach((entry) => {
    entry.ignoreReport.duplicateKeys.forEach((item) => ignoredDuplicateKeys.add(item));
    entry.ignoreReport.ambiguousKeys.forEach((item) => ignoredAmbiguousKeys.add(item));
    entry.ignoreReport.folderConflictFiles.forEach((item) => ignoredFolderConflictFiles.add(item));
    entry.ignoreReport.missingPairKeys.forEach((item) => ignoredMissingPairKeys.add(item));
    entry.ignoreReport.suspiciousKeys.forEach((item) => ignoredSuspiciousKeys.add(item));
  });

  active.duplicates = Array.isArray(active.duplicates)
    ? active.duplicates.filter((item) => {
        if (ignoredDuplicateKeys.has(String(item.chave || ""))) {
          resolved.duplicates.push(item);
          return false;
        }

        return true;
      })
    : [];

  active.ambiguous_items = Array.isArray(active.ambiguous_items)
    ? active.ambiguous_items.filter((item) => {
        if (ignoredAmbiguousKeys.has(String(item.chave || ""))) {
          resolved.ambiguous_items.push(item);
          return false;
        }

        return true;
      })
    : [];

  active.folder_conflicts = Array.isArray(active.folder_conflicts)
    ? active.folder_conflicts.filter((item) => {
        if (ignoredFolderConflictFiles.has(String(item.arquivo || ""))) {
          resolved.folder_conflicts.push(item);
          return false;
        }

        return true;
      })
    : [];

  active.missing_pairs = Array.isArray(active.missing_pairs)
    ? active.missing_pairs.filter((item) => {
        if (ignoredMissingPairKeys.has(String(item.chave || ""))) {
          resolved.missing_pairs.push(item);
          return false;
        }

        return true;
      })
    : [];

  active.suspicious_items = Array.isArray(active.suspicious_items)
    ? active.suspicious_items.filter((item) => {
        if (ignoredSuspiciousKeys.has(String(item.chave || ""))) {
          resolved.suspicious_items.push(item);
          return false;
        }

        return true;
      })
    : [];

  active.summary = {
    ...(active.summary || {}),
    active_duplicate_groups_count: active.duplicates.length,
    active_ambiguous_items_count: active.ambiguous_items.length,
    active_folder_conflict_count: active.folder_conflicts.length,
    active_missing_pairs_count: active.missing_pairs.length,
    active_suspicious_items_count: active.suspicious_items.length,
  };

  return { active, resolved };
}

function derivePendingFlags(item = {}) {
  const pending = [];

  if (!item.prova?.principal) {
    pending.push("prova");
  }

  if (!item.gabarito?.principal) {
    pending.push("gabarito");
  }

  return pending;
}

function buildCatalogItems(manifest = [], overridesIndex = new Map()) {
  return manifest.map((item) => {
    const key = buildItemKey(item);
    const override = overridesIndex.get(key) || null;
    const pending = derivePendingFlags(item);

    return {
      ...cloneJson(item),
      chave: key,
      manifest_status: item.status,
      status: override?.status || item.status,
      pendencias: pending,
      override_aplicado: Boolean(override),
      notes: override?.notes || [],
      tags: override?.tags || [],
    };
  });
}

function buildCatalogSummary({ items = [], activeReport, resolvedReport, overridesIndex }) {
  return {
    total_items: items.length,
    ok_items: items.filter((item) => item.status === "ok").length,
    review_items: items.filter((item) => item.status === "review").length,
    missing_prova_items: items.filter((item) => item.pendencias.includes("prova")).length,
    missing_gabarito_items: items.filter((item) => item.pendencias.includes("gabarito")).length,
    overrides_applied: items.filter((item) => item.override_aplicado).length,
    override_entries_configured: overridesIndex.size,
    active_issues: {
      duplicates: activeReport.duplicates.length,
      ambiguous_items: activeReport.ambiguous_items.length,
      folder_conflicts: activeReport.folder_conflicts.length,
      missing_pairs: activeReport.missing_pairs.length,
      suspicious_items: activeReport.suspicious_items.length,
    },
    resolved_by_overrides: {
      duplicates: resolvedReport.duplicates.length,
      ambiguous_items: resolvedReport.ambiguous_items.length,
      folder_conflicts: resolvedReport.folder_conflicts.length,
      missing_pairs: resolvedReport.missing_pairs.length,
      suspicious_items: resolvedReport.suspicious_items.length,
    },
  };
}

export async function loadEnemCatalog({
  repoRoot = process.cwd(),
  manifestPath = path.join(repoRoot, "data", "provas", "enem", "manifest.enem.json"),
  reportPath = path.join(repoRoot, "data", "provas", "enem", "manifest.enem.report.json"),
  overridesPath = path.join(repoRoot, "data", "provas", "enem", "manifest.enem.overrides.json"),
} = {}) {
  const [manifest, report, overridesDocument] = await Promise.all([
    readJsonFile(manifestPath),
    readJsonFile(reportPath),
    readJsonFile(overridesPath, { version: 1, updatedAt: "", entries: [] }),
  ]);

  if (!Array.isArray(manifest)) {
    throw new Error(`Manifest invalido em ${manifestPath}: esperado um array.`);
  }

  const overridesIndex = indexOverrides(overridesDocument);
  const { active: activeReport, resolved: resolvedReport } = filterIssueBuckets(report, overridesIndex);
  const items = buildCatalogItems(manifest, overridesIndex);
  const summary = buildCatalogSummary({
    items,
    activeReport,
    resolvedReport,
    overridesIndex,
  });

  return {
    source: {
      manifestPath: toPosixPath(path.relative(repoRoot, manifestPath)),
      reportPath: toPosixPath(path.relative(repoRoot, reportPath)),
      overridesPath: toPosixPath(path.relative(repoRoot, overridesPath)),
    },
    overrides: {
      version: overridesDocument.version || 1,
      updatedAt: overridesDocument.updatedAt || "",
      entries: [...overridesIndex.values()],
    },
    summary,
    items,
    activeReport,
    resolvedReport,
  };
}

export async function listEnemCatalogItems(options = {}) {
  const catalog = await loadEnemCatalog(options);
  return catalog.items;
}

export async function findEnemCatalogItem(match = {}, options = {}) {
  const catalog = await loadEnemCatalog(options);
  const key = buildItemKey(match);
  return catalog.items.find((item) => item.chave === key) || null;
}
