import { promises as fs } from "node:fs";
import path from "node:path";

const YEAR_DIRECTORY_PATTERN = /^\d{4}$/;
const ENEM_FILE_PATTERN =
  /^(?<year>\d{4})_(?<kind>PV|GB)_impresso_D(?<day>\d+)_CD(?<booklet>\d+)(?<variant>_(?:superampliada|ampliada))?(?: \((?<copy>\d+)\))?\.pdf$/i;

const EXPECTED_DIRECTORIES = {
  prova: new Set(["prova", "provas"]),
  gabarito: new Set(["gabarito"]),
};

const VARIANT_PRIORITY = ["normal", "ampliada", "superampliada"];

function toPosixPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function normalizeFolderKind(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "prova" || normalized === "provas") {
    return "prova";
  }

  if (normalized === "gabarito") {
    return "gabarito";
  }

  return "";
}

function normalizeVariant(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "_ampliada") {
    return "ampliada";
  }

  if (normalized === "_superampliada") {
    return "superampliada";
  }

  return "normal";
}

function typeFromFileKind(kind = "") {
  return String(kind || "").toUpperCase() === "GB" ? "gabarito" : "prova";
}

function buildBundleKey({ year, day, booklet }) {
  return `${year}:D${day}:${booklet}`;
}

function buildTypeKey({ year, type, day, booklet }) {
  return `${year}:${type}:D${day}:${booklet}`;
}

function sortByCanonicalPath(a, b) {
  return a.relativePath.localeCompare(b.relativePath, "pt-BR");
}

function sortCandidatesForVariant(candidates = [], expectedType = "") {
  return [...candidates].sort((left, right) => {
    const leftCopyRank = left.copyIndex === null ? 0 : 1;
    const rightCopyRank = right.copyIndex === null ? 0 : 1;

    if (leftCopyRank !== rightCopyRank) {
      return leftCopyRank - rightCopyRank;
    }

    const leftFolderRank = left.type === expectedType && left.folderMatchesExpected ? 0 : 1;
    const rightFolderRank = right.type === expectedType && right.folderMatchesExpected ? 0 : 1;

    if (leftFolderRank !== rightFolderRank) {
      return leftFolderRank - rightFolderRank;
    }

    return sortByCanonicalPath(left, right);
  });
}

function createIssuePayload(candidate) {
  return {
    arquivo: candidate.relativePath,
    nome_original: candidate.filename,
    ano: candidate.year,
    tipo: candidate.type,
    dia: candidate.day,
    caderno: candidate.booklet,
    variante: candidate.variant,
  };
}

export function parseEnemPdfFilename(filename = "") {
  const basename = path.basename(String(filename || "").trim());
  const match = ENEM_FILE_PATTERN.exec(basename);

  if (!match?.groups) {
    return null;
  }

  const year = Number(match.groups.year || 0);
  const day = Number(match.groups.day || 0);
  const bookletNumber = Number(match.groups.booklet || 0);

  if (!year || !day || !bookletNumber) {
    return null;
  }

  return {
    year,
    kind: String(match.groups.kind || "").toUpperCase(),
    type: typeFromFileKind(match.groups.kind),
    day,
    booklet: `CD${bookletNumber}`,
    bookletNumber,
    variant: normalizeVariant(match.groups.variant),
    copyIndex: match.groups.copy ? Number(match.groups.copy || 0) || 0 : null,
  };
}

async function listDirectoryEntries(targetDirectory) {
  try {
    return await fs.readdir(targetDirectory, { withFileTypes: true });
  } catch (error) {
    return { error };
  }
}

export async function scanEnemPdfTree({
  repoRoot = process.cwd(),
  enemRoot = path.join(repoRoot, "data", "provas", "enem"),
} = {}) {
  const rootEntries = await listDirectoryEntries(enemRoot);

  if (rootEntries?.error) {
    throw new Error(`Nao foi possivel ler ${enemRoot}: ${rootEntries.error.message}`);
  }

  const report = {
    ignored_directories: [],
    invalid_pattern: [],
    folder_conflicts: [],
    unreadable_directories: [],
  };

  const files = [];
  const yearDirectories = rootEntries
    .filter((entry) => entry.isDirectory() && YEAR_DIRECTORY_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const yearName of yearDirectories) {
    const yearDirectory = path.join(enemRoot, yearName);
    const children = await listDirectoryEntries(yearDirectory);

    if (children?.error) {
      report.unreadable_directories.push({
        diretorio: toPosixPath(path.relative(repoRoot, yearDirectory)),
        motivo: children.error.message,
      });
      continue;
    }

    for (const child of children) {
      if (!child.isDirectory()) {
        continue;
      }

      const normalizedFolder = normalizeFolderKind(child.name);
      const folderDirectory = path.join(yearDirectory, child.name);
      const relativeDirectory = toPosixPath(path.relative(repoRoot, folderDirectory));

      if (!normalizedFolder) {
        report.ignored_directories.push({
          diretorio: relativeDirectory,
          motivo: "subpasta fora do padrao esperado",
        });
        continue;
      }

      const folderEntries = await listDirectoryEntries(folderDirectory);

      if (folderEntries?.error) {
        report.unreadable_directories.push({
          diretorio: relativeDirectory,
          motivo: folderEntries.error.message,
        });
        continue;
      }

      for (const entry of folderEntries) {
        if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".pdf") {
          continue;
        }

        const absolutePath = path.join(folderDirectory, entry.name);
        const relativePath = toPosixPath(path.relative(repoRoot, absolutePath));
        const parsed = parseEnemPdfFilename(entry.name);

        if (!parsed) {
          report.invalid_pattern.push({
            arquivo: relativePath,
            nome_original: entry.name,
            motivo: "nome fora do padrao esperado",
          });
          continue;
        }

        const folderMatchesExpected = EXPECTED_DIRECTORIES[parsed.type]?.has(child.name.toLowerCase()) || false;

        if (!folderMatchesExpected) {
          report.folder_conflicts.push({
            arquivo: relativePath,
            nome_original: entry.name,
            tipo_detectado: parsed.type,
            pasta_encontrada: child.name,
            pasta_esperada: parsed.type === "prova" ? "prova/provas" : "gabarito",
          });
        }

        files.push({
          ...parsed,
          filename: entry.name,
          absolutePath,
          relativePath,
          yearDirectory: Number(yearName),
          sourceFolder: child.name,
          sourceFolderKind: normalizedFolder,
          folderMatchesExpected,
          bundleKey: buildBundleKey(parsed),
          typeKey: buildTypeKey(parsed),
        });
      }
    }
  }

  return { files, report, enemRoot };
}

function resolveGroupedType({
  candidates = [],
  expectedType = "",
  report,
  bundleContext,
}) {
  if (!candidates.length) {
    return null;
  }

  const selectedByVariant = new Map();
  const duplicateCandidates = [];

  for (const variant of VARIANT_PRIORITY) {
    const variantCandidates = candidates.filter((candidate) => candidate.variant === variant);

    if (!variantCandidates.length) {
      continue;
    }

    const sorted = sortCandidatesForVariant(variantCandidates, expectedType);
    const selected = sorted[0];
    selectedByVariant.set(variant, selected);

    if (sorted.length > 1) {
      duplicateCandidates.push(...sorted.slice(1));
    }

    const primaryCandidates = sorted.filter((candidate) => candidate.copyIndex === null);

    if (primaryCandidates.length > 1) {
      report.ambiguous_items.push({
        chave: buildTypeKey({ ...bundleContext, type: expectedType }),
        ano: bundleContext.year,
        dia: bundleContext.day,
        caderno: bundleContext.booklet,
        tipo: expectedType,
        variante: variant,
        arquivos: primaryCandidates.map((candidate) => candidate.relativePath),
        motivo: "multiplos arquivos principais para a mesma variante",
      });
    }
  }

  const principalVariant = VARIANT_PRIORITY.find((variant) => selectedByVariant.has(variant)) || "";
  const principalCandidate = principalVariant ? selectedByVariant.get(principalVariant) : null;

  if (!principalCandidate) {
    return null;
  }

  const duplicatePaths = duplicateCandidates.map((candidate) => candidate.relativePath);

  if (duplicatePaths.length) {
    report.duplicates.push({
      chave: buildTypeKey({ ...bundleContext, type: expectedType }),
      ano: bundleContext.year,
      dia: bundleContext.day,
      caderno: bundleContext.booklet,
      tipo: expectedType,
      principal: principalCandidate.relativePath,
      duplicatas: duplicatePaths,
    });
  }

  if (principalCandidate.copyIndex !== null) {
    report.suspicious_items.push({
      chave: buildTypeKey({ ...bundleContext, type: expectedType }),
      ano: bundleContext.year,
      dia: bundleContext.day,
      caderno: bundleContext.booklet,
      tipo: expectedType,
      motivo: "arquivo principal escolhido a partir de copia duplicada",
      arquivo: principalCandidate.relativePath,
    });
  }

  if (!principalCandidate.folderMatchesExpected) {
    report.suspicious_items.push({
      chave: buildTypeKey({ ...bundleContext, type: expectedType }),
      ano: bundleContext.year,
      dia: bundleContext.day,
      caderno: bundleContext.booklet,
      tipo: expectedType,
      motivo: "arquivo principal esta em uma pasta diferente da esperada",
      arquivo: principalCandidate.relativePath,
    });
  }

  const variants = VARIANT_PRIORITY.filter((variant) => variant !== principalVariant && selectedByVariant.has(variant)).map(
    (variant) => {
      const selected = selectedByVariant.get(variant);

      return {
        tipo: variant,
        arquivo: selected.relativePath,
        nome_original: selected.filename,
      };
    }
  );

  return {
    principal: principalCandidate.relativePath,
    nome_original: principalCandidate.filename,
    variante_principal: principalVariant,
    variantes: variants,
    duplicatas: duplicatePaths,
  };
}

function determineManifestStatus({ prova, gabarito, hasWarnings = false }) {
  if (!prova) {
    return "missing_prova";
  }

  if (!gabarito) {
    return "missing_gabarito";
  }

  return hasWarnings ? "review" : "ok";
}

export function buildEnemManifest(records = [], initialReport = {}) {
  const report = {
    generated_at: new Date().toISOString(),
    source_root: "data/provas/enem",
    summary: {},
    invalid_pattern: [...(initialReport.invalid_pattern || [])],
    folder_conflicts: [...(initialReport.folder_conflicts || [])],
    duplicates: [],
    missing_pairs: [],
    ambiguous_items: [],
    suspicious_items: [],
    ignored_directories: [...(initialReport.ignored_directories || [])],
    unreadable_directories: [...(initialReport.unreadable_directories || [])],
  };

  const groupedBundles = new Map();

  records.forEach((record) => {
    const existing = groupedBundles.get(record.bundleKey) || {
      year: record.year,
      day: record.day,
      booklet: record.booklet,
      provaCandidates: [],
      gabaritoCandidates: [],
    };

    if (record.type === "prova") {
      existing.provaCandidates.push(record);
    } else {
      existing.gabaritoCandidates.push(record);
    }

    groupedBundles.set(record.bundleKey, existing);
  });

  const manifest = [...groupedBundles.values()]
    .sort((left, right) => {
      if (left.year !== right.year) {
        return left.year - right.year;
      }

      if (left.day !== right.day) {
        return left.day - right.day;
      }

      const leftBookletNumber = Number(String(left.booklet).replace(/\D+/g, "")) || 0;
      const rightBookletNumber = Number(String(right.booklet).replace(/\D+/g, "")) || 0;
      return leftBookletNumber - rightBookletNumber;
    })
    .map((bundle) => {
      const bundleContext = {
        year: bundle.year,
        day: bundle.day,
        booklet: bundle.booklet,
      };

      const proofEntry = resolveGroupedType({
        candidates: bundle.provaCandidates,
        expectedType: "prova",
        report,
        bundleContext,
      });

      const answerKeyEntry = resolveGroupedType({
        candidates: bundle.gabaritoCandidates,
        expectedType: "gabarito",
        report,
        bundleContext,
      });

      if (!proofEntry) {
        report.missing_pairs.push({
          chave: buildBundleKey(bundle),
          ano: bundle.year,
          dia: bundle.day,
          caderno: bundle.booklet,
          falta: "prova",
        });
      }

      if (!answerKeyEntry) {
        report.missing_pairs.push({
          chave: buildBundleKey(bundle),
          ano: bundle.year,
          dia: bundle.day,
          caderno: bundle.booklet,
          falta: "gabarito",
        });
      }

      const bundleWarnings =
        report.ambiguous_items.some(
          (item) =>
            item.ano === bundle.year &&
            item.dia === bundle.day &&
            item.caderno === bundle.booklet
        ) ||
        report.folder_conflicts.some(
          (item) =>
            item.arquivo &&
            [proofEntry?.principal, answerKeyEntry?.principal, ...(proofEntry?.duplicatas || []), ...(answerKeyEntry?.duplicatas || [])].includes(
              item.arquivo
            )
        );

      return {
        vestibular: "ENEM",
        ano: bundle.year,
        dia: bundle.day,
        caderno: bundle.booklet,
        prova: proofEntry,
        gabarito: answerKeyEntry,
        status: determineManifestStatus({
          prova: proofEntry,
          gabarito: answerKeyEntry,
          hasWarnings: bundleWarnings,
        }),
      };
    });

  const okItems = manifest.filter((item) => item.status === "ok").length;
  const reviewItems = manifest.filter((item) => item.status === "review").length;
  const missingProofItems = manifest.filter((item) => item.status === "missing_prova").length;
  const missingAnswerKeyItems = manifest.filter((item) => item.status === "missing_gabarito").length;

  report.summary = {
    total_files_scanned: records.length + report.invalid_pattern.length,
    valid_files: records.length,
    manifest_items: manifest.length,
    ok_items: okItems,
    review_items: reviewItems,
    missing_prova_items: missingProofItems,
    missing_gabarito_items: missingAnswerKeyItems,
    invalid_pattern_count: report.invalid_pattern.length,
    folder_conflict_count: report.folder_conflicts.length,
    duplicate_groups_count: report.duplicates.length,
    ambiguous_items_count: report.ambiguous_items.length,
    suspicious_items_count: report.suspicious_items.length,
  };

  return { manifest, report };
}

export async function writeEnemManifestFiles({
  repoRoot = process.cwd(),
  enemRoot = path.join(repoRoot, "data", "provas", "enem"),
  manifestPath = path.join(enemRoot, "manifest.enem.json"),
  reportPath = path.join(enemRoot, "manifest.enem.report.json"),
} = {}) {
  const { files, report: scanReport } = await scanEnemPdfTree({ repoRoot, enemRoot });
  const { manifest, report } = buildEnemManifest(files, scanReport);

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    manifest,
    report,
    manifestPath,
    reportPath,
  };
}
