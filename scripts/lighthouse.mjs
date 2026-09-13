import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as waitMilliseconds } from "node:timers/promises";
import os from "node:os";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";

/* - Audita Início e Detalhe do NFT em Lighthouse, nos perfis mobile e desktop, com o cenário padrão dos mocks (sem parâmetro "?scenario="). Builda a aplicação, sobe o preview em modo otimizado, roda três medições por página/perfil e reporta a mediana de cada categoria, além de LCP, CLS e TBT. Os relatórios HTML/JSON ficam versionados em reports/lighthouse/<data>. - */

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));
const projectRootDirectoryPath = resolve(currentDirectoryPath, "..");

const PREVIEW_SERVER_PORT = 4173;
const PREVIEW_SERVER_BASE_URL = `http://localhost:${PREVIEW_SERVER_PORT}`;
const NUMBER_OF_RUNS_PER_PAGE_AND_PROFILE = 3;
const SERVER_READY_TIMEOUT_IN_MILLISECONDS = 30000;
const SERVER_READY_POLL_INTERVAL_IN_MILLISECONDS = 500;

/* - Id de NFT estável, presente nas fixtures padrão, usado para auditar a tela de detalhe. - */

const SAMPLE_NFT_ID_FOR_DETAIL_PAGE_AUDIT = "emerald-ape-042";

const pagesToAudit = [
  { pageLabel: "inicio", pathname: "/" },
  { pageLabel: "detalhe-do-nft", pathname: `/nfts/${SAMPLE_NFT_ID_FOR_DETAIL_PAGE_AUDIT}` },
];

/* - Metas de pontuação definidas na seção 10 do enunciado, usadas apenas para reportar aprovação ou reprovação de cada categoria — o script não falha o processo por metas não atingidas, já que resultados abaixo delas devem ser justificados em documentação, não silenciados. - */

const evaluationCategoryTargets = {
  performance: 90,
  accessibility: 95,
  bestPractices: 95,
  seo: 90,
};

/* - Perfis de dispositivo auditados. O perfil desktop replica a configuração interna que o próprio Lighthouse usa para a preset "desktop" (RTT de 40ms, 10 Mbps, sem desaceleração de CPU), para não depender de um caminho de importação interno que muda entre versões. - */

const deviceProfiles = [
  {
    profileLabel: "mobile",
    lighthouseConfig: {
      extends: "lighthouse:default",
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false },
      },
    },
  },

  {
    profileLabel: "desktop",
    lighthouseConfig: {
      extends: "lighthouse:default",
      settings: {
        formFactor: "desktop",
        screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
  },
];

/* - Pasta de saída versionada por execução, para permitir comparar auditorias ao longo do tempo sem sobrescrever relatórios anteriores. - */

const auditTimestampLabel = new Date().toISOString().replace(/[:.]/g, "-");
const auditReportsDirectoryPath = resolve(projectRootDirectoryPath, "reports", "lighthouse", auditTimestampLabel);

/* - Constrói a aplicação em modo otimizado, com os mocks habilitados no cenário padrão, para que a auditoria reflita exatamente o que será entregue — sem simplificações exclusivas para melhorar a pontuação. O socket aponta para a mesma porta do preview porque o valor de VITE_SOCKET_URL é fixado em tempo de build. - */

const buildOptimizedApplication = () => {
  console.log("Construindo a aplicação em modo otimizado...");

  const buildResult = spawnSync("npm", ["run", "build"], {
    cwd: projectRootDirectoryPath,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_ENABLE_MOCKS: "true",
      VITE_SOCKET_URL: `ws://localhost:${PREVIEW_SERVER_PORT}`,
    },
  });

  if (buildResult.status !== 0) {
    throw new Error("A build otimizada falhou; corrija os erros antes de rodar a auditoria.");
  }
};

/* - Sobe o preview do build otimizado em segundo plano e só devolve o controle quando o servidor já responde, evitando que a primeira auditoria comece contra um servidor ainda subindo. - */

const startPreviewServerAndWaitUntilReady = async () => {
  console.log("Iniciando o servidor de preview...");

  const previewServerProcess = spawn("npm", ["run", "preview", "--", "--port", String(PREVIEW_SERVER_PORT), "--strictPort"], {
    cwd: projectRootDirectoryPath,
    stdio: "inherit",
  });

  const readyDeadline = Date.now() + SERVER_READY_TIMEOUT_IN_MILLISECONDS;

  while (Date.now() < readyDeadline) {
    try {
      const readinessResponse = await fetch(PREVIEW_SERVER_BASE_URL);

      if (readinessResponse.ok) {
        return previewServerProcess;
      }
    } catch {
      /* - O servidor ainda não aceita conexões; tenta de novo até o tempo limite. - */
    }

    await waitMilliseconds(SERVER_READY_POLL_INTERVAL_IN_MILLISECONDS);
  }

  previewServerProcess.kill();
  throw new Error("O servidor de preview não ficou pronto a tempo.");
};

const calculateMedianValue = (numberList) => {
  const sortedNumberList = [...numberList].sort((firstValue, secondValue) => firstValue - secondValue);
  const middleIndex = Math.floor(sortedNumberList.length / 2);

  if (sortedNumberList.length % 2 === 0) {
    return (sortedNumberList[middleIndex - 1] + sortedNumberList[middleIndex]) / 2;
  }

  return sortedNumberList[middleIndex];
};

/* - Roda uma única medição do Lighthouse contra a página informada e grava o relatório HTML e o relatório JSON dessa execução, para permitir auditoria posterior run a run. - */

const runSingleLighthouseAudit = async ({ chromePort, pageUrl, lighthouseConfig, reportFileNamePrefix }) => {
  const lighthouseRunnerResult = await lighthouse(pageUrl, { port: chromePort, output: ["html", "json"], logLevel: "error" }, lighthouseConfig);

  const [htmlReportContent, jsonReportContent] = lighthouseRunnerResult.report;

  writeFileSync(resolve(auditReportsDirectoryPath, `${reportFileNamePrefix}.html`), htmlReportContent, "utf-8");
  writeFileSync(resolve(auditReportsDirectoryPath, `${reportFileNamePrefix}.json`), jsonReportContent, "utf-8");

  return lighthouseRunnerResult.lhr;
};

/* - Roda as três medições exigidas para uma combinação de página e perfil, e resume o resultado na mediana de cada categoria e das três métricas de performance pedidas (LCP, CLS e TBT). - */

const auditPageForDeviceProfile = async ({ chromePort, pageLabel, pathname, profileLabel, lighthouseConfig }) => {
  const pageUrl = `${PREVIEW_SERVER_BASE_URL}${pathname}`;
  const lighthouseResultsByRun = [];

  for (let runIndex = 1; runIndex <= NUMBER_OF_RUNS_PER_PAGE_AND_PROFILE; runIndex += 1) {
    console.log(`Auditando ${pageLabel} (${profileLabel}), execução ${runIndex} de ${NUMBER_OF_RUNS_PER_PAGE_AND_PROFILE}...`);

    const lighthouseResult = await runSingleLighthouseAudit({
      chromePort,
      pageUrl,
      lighthouseConfig,
      reportFileNamePrefix: `${pageLabel}-${profileLabel}-execucao-${runIndex}`,
    });

    lighthouseResultsByRun.push(lighthouseResult);
  }

  const performanceScoresByRun = lighthouseResultsByRun.map((lhr) => lhr.categories.performance.score * 100);
  const accessibilityScoresByRun = lighthouseResultsByRun.map((lhr) => lhr.categories.accessibility.score * 100);
  const bestPracticesScoresByRun = lighthouseResultsByRun.map((lhr) => lhr.categories["best-practices"].score * 100);
  const seoScoresByRun = lighthouseResultsByRun.map((lhr) => lhr.categories.seo.score * 100);

  const largestContentfulPaintByRun = lighthouseResultsByRun.map((lhr) => lhr.audits["largest-contentful-paint"].numericValue);
  const cumulativeLayoutShiftByRun = lighthouseResultsByRun.map((lhr) => lhr.audits["cumulative-layout-shift"].numericValue);
  const totalBlockingTimeByRun = lighthouseResultsByRun.map((lhr) => lhr.audits["total-blocking-time"].numericValue);

  return {
    pageLabel,
    profileLabel,
    performanceScoreMedian: calculateMedianValue(performanceScoresByRun),
    accessibilityScoreMedian: calculateMedianValue(accessibilityScoresByRun),
    bestPracticesScoreMedian: calculateMedianValue(bestPracticesScoresByRun),
    seoScoreMedian: calculateMedianValue(seoScoresByRun),
    largestContentfulPaintMedianInMilliseconds: calculateMedianValue(largestContentfulPaintByRun),
    cumulativeLayoutShiftMedian: calculateMedianValue(cumulativeLayoutShiftByRun),
    totalBlockingTimeMedianInMilliseconds: calculateMedianValue(totalBlockingTimeByRun),
  };
};

/* - Formata uma linha da tabela de resumo, marcando cada categoria com aprovado ou reprovado em relação à meta correspondente da seção 10 do enunciado. - */

const formatCategoryResultText = (scoreMedian, targetScore) => {
  const roundedScore = Math.round(scoreMedian);
  const statusLabel = scoreMedian >= targetScore ? "aprovado" : "reprovado";

  return `${roundedScore} (meta ${targetScore}, ${statusLabel})`;
};

const buildMarkdownSummaryReport = (auditSummariesByPageAndProfile) => {
  const tableHeaderRow = "| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |";
  const tableDividerRow = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |";

  const tableDataRows = auditSummariesByPageAndProfile.map((auditSummary) => {
    return [
      "|",
      auditSummary.pageLabel,
      "|",
      auditSummary.profileLabel,
      "|",
      formatCategoryResultText(auditSummary.performanceScoreMedian, evaluationCategoryTargets.performance),
      "|",
      formatCategoryResultText(auditSummary.accessibilityScoreMedian, evaluationCategoryTargets.accessibility),
      "|",
      formatCategoryResultText(auditSummary.bestPracticesScoreMedian, evaluationCategoryTargets.bestPractices),
      "|",
      formatCategoryResultText(auditSummary.seoScoreMedian, evaluationCategoryTargets.seo),
      "|",
      Math.round(auditSummary.largestContentfulPaintMedianInMilliseconds),
      "|",
      auditSummary.cumulativeLayoutShiftMedian.toFixed(3),
      "|",
      Math.round(auditSummary.totalBlockingTimeMedianInMilliseconds),
      "|",
    ].join(" ");
  });

  return [
    "# Resumo da auditoria Lighthouse",
    "",
    `Executado em ${new Date().toISOString()}, com ${NUMBER_OF_RUNS_PER_PAGE_AND_PROFILE} medições por página e perfil (mediana reportada).`,
    "",
    tableHeaderRow,
    tableDividerRow,
    ...tableDataRows,
    "",
    "Resultados abaixo da meta devem ser justificados em ARCHITECTURE.md, com a causa identificada.",
  ].join("\n");
};

const runLighthouseAuditSuite = async () => {
  mkdirSync(auditReportsDirectoryPath, { recursive: true });

  buildOptimizedApplication();
  const previewServerProcess = await startPreviewServerAndWaitUntilReady();

  const chromeInstance = await launchChrome({ chromeFlags: ["--headless=new", "--no-sandbox"] });
  const packageManifest = JSON.parse(readFileSync(resolve(projectRootDirectoryPath, "package.json"), "utf-8"));

  writeFileSync(
    resolve(auditReportsDirectoryPath, "ambiente.json"),
    JSON.stringify(
      {
        executedAt: new Date().toISOString(),
        node: process.version,
        npm: String(spawnSync("npm", ["--version"], { encoding: "utf-8" }).stdout).trim(),
        lighthouse: packageManifest.devDependencies?.lighthouse ?? null,
        playwright: packageManifest.devDependencies?.["@playwright/test"] ?? null,
        vite: packageManifest.devDependencies?.vite ?? null,
        react: packageManifest.dependencies?.react ?? null,
        tanstackRouter: packageManifest.dependencies?.["@tanstack/react-router"] ?? null,
        tanstackQuery: packageManifest.dependencies?.["@tanstack/react-query"] ?? null,
        platform: `${os.platform()} ${os.release()} ${os.arch()}`,
        chrome: chromeInstance.version,
        previewUrl: PREVIEW_SERVER_BASE_URL,
        runsPerPageAndProfile: NUMBER_OF_RUNS_PER_PAGE_AND_PROFILE,
        profiles: deviceProfiles.map((profile) => profile.profileLabel),
        pages: pagesToAudit.map((page) => page.pathname),
      },
      null,
      2,
    ),
  );

  try {
    const auditSummariesByPageAndProfile = [];

    for (const pageToAudit of pagesToAudit) {
      for (const deviceProfile of deviceProfiles) {
        const auditSummary = await auditPageForDeviceProfile({
          chromePort: chromeInstance.port,
          pageLabel: pageToAudit.pageLabel,
          pathname: pageToAudit.pathname,
          profileLabel: deviceProfile.profileLabel,
          lighthouseConfig: deviceProfile.lighthouseConfig,
        });

        auditSummariesByPageAndProfile.push(auditSummary);
      }
    }

    const markdownSummaryReportContent = buildMarkdownSummaryReport(auditSummariesByPageAndProfile);

    writeFileSync(resolve(auditReportsDirectoryPath, "resumo.md"), markdownSummaryReportContent, "utf-8");
    writeFileSync(resolve(auditReportsDirectoryPath, "resumo.json"), JSON.stringify(auditSummariesByPageAndProfile, null, 2), "utf-8");

    console.log("");
    console.log(markdownSummaryReportContent);
    console.log("");
    console.log(`Relatórios completos salvos em ${auditReportsDirectoryPath}`);
  } finally {
    chromeInstance.kill();
    previewServerProcess.kill();
  }
};

runLighthouseAuditSuite().catch((auditError) => {
  console.error("A auditoria Lighthouse falhou:", auditError);
  process.exitCode = 1;
});
