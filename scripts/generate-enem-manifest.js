import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeEnemManifestFiles } from "../backend/enem_manifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const result = await writeEnemManifestFiles({ repoRoot });

console.log(
  JSON.stringify(
    {
      manifestPath: path.relative(repoRoot, result.manifestPath),
      reportPath: path.relative(repoRoot, result.reportPath),
      manifestItems: result.manifest.length,
      summary: result.report.summary,
    },
    null,
    2
  )
);
