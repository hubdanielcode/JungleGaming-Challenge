import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredFiles = [
  "package-lock.json",
  "public/mockServiceWorker.js",
  "components.json",
  "ARCHITECTURE.md",
  "README.md",
];

const requiredVisualBaselines = [
  "home-chromium-desktop.png",
  "home-chromium-mobile.png",
  "nft-detail-chromium-desktop.png",
  "nft-detail-chromium-mobile.png",
  "cart-chromium-desktop.png",
  "cart-chromium-mobile.png",
  "payment-chromium-desktop.png",
  "payment-chromium-mobile.png",
];

const failures = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) failures.push(`Arquivo obrigatório ausente: ${relativePath}`);
}

const snapshotDirectory = resolve(root, "tests/e2e/visualRegression.spec.ts-snapshots");
for (const snapshot of requiredVisualBaselines) {
  if (!existsSync(resolve(snapshotDirectory, snapshot))) failures.push(`Baseline visual ausente: tests/e2e/visualRegression.spec.ts-snapshots/${snapshot}`);
}

const readme = readFileSync(resolve(root, "README.md"), "utf-8");
if (!/https:\/\/[^\s)]+/.test(readme)) failures.push("README.md não contém uma URL pública.");

const lighthouseReportsDirectory = resolve(root, "reports/lighthouse");
if (!existsSync(lighthouseReportsDirectory)) failures.push("Relatórios Lighthouse ausentes: execute npm run lighthouse e versione reports/lighthouse/<timestamp>.");

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
for (const scriptName of ["build", "typecheck", "lint", "test:e2e", "lighthouse"]) {
  if (!packageJson.scripts?.[scriptName]) failures.push(`Script obrigatório ausente: npm run ${scriptName}`);
}

const architecture = readFileSync(resolve(root, "ARCHITECTURE.md"), "utf-8");
for (const requiredText of ["Socket.IO", "idempotência", "cache", "reconciliação"]) {
  if (!architecture.toLowerCase().includes(requiredText.toLowerCase())) failures.push(`ARCHITECTURE.md não documenta: ${requiredText}`);
}

if (failures.length) {
  console.error("PRE-DEPLOY CHECK: BLOQUEADO");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PRE-DEPLOY CHECK: OK — arquivos e baselines obrigatórios presentes.");
