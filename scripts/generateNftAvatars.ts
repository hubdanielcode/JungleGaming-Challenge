import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* - Gera uma arte abstrata determinística por seed, na paleta da marca, para substituir o picsum.photos. Sem essa geração local, as fixtures dependeriam de um serviço externo de fotos aleatórias — o que quebra a fidelidade visual com o Figma e o requisito de imagens acessíveis à execução local. - */

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));
const outputDirectoryPath = resolve(currentDirectoryPath, "../public/images/nfts");
const nftFixturesFilePath = resolve(currentDirectoryPath, "../src/mocks/fixtures/nfts.ts");

const FUR_COLORS = ["#8A6349", "#6E4A34", "#B08968", "#5C4433", "#9C7A54"];
const MUZZLE_COLORS = ["#E8D9C0", "#DFC9A8", "#EFE2CC"];
const BACKGROUND_COLORS = ["#EAE3D3", "#DCE7E0", "#E3D8CE", "#D8E2E4"];
const ACCESSORY_COLORS = ["#D08848", "#7AAB5C", "#C65B45", "#3E5C6B", "#5B4636"];
const ACCESSORY_KINDS = ["none", "sunglasses", "hat", "headphones"] as const;

/* - Hash simples e determinístico (string para inteiro de 32 bits), suficiente para variar a arte por seed. - */

const hashSeedToInteger = (seedText: string) => {
  let hashValue = 0;

  for (let characterIndex = 0; characterIndex < seedText.length; characterIndex += 1) {
    hashValue = (hashValue << 5) - hashValue + seedText.charCodeAt(characterIndex);
    hashValue |= 0;
  }

  return Math.abs(hashValue);
};

const createPseudoRandomGenerator = (seedText: string) => {
  let internalState = hashSeedToInteger(seedText) || 1;

  return () => {
    internalState = (internalState * 1103515245 + 12345) & 0x7fffffff;
    return internalState / 0x7fffffff;
  };
};

const pickFromList = <ListItem>(itemList: readonly ListItem[], nextRandomValue: () => number) => {
  return itemList[Math.floor(nextRandomValue() * itemList.length)];
};

/* - Retrato estilizado de macaco em formas geométricas simples: cabeça, orelhas, focinho, olhos e um acessório variável (óculos, chapéu ou headphone), inspirado na variedade de estilo vista no Figma. - */

const createNftAvatarSvg = (seedText: string) => {
  const nextRandomValue = createPseudoRandomGenerator(seedText);

  const backgroundColor = pickFromList(BACKGROUND_COLORS, nextRandomValue);
  const furColor = pickFromList(FUR_COLORS, nextRandomValue);
  const muzzleColor = pickFromList(MUZZLE_COLORS, nextRandomValue);
  const accessoryColor = pickFromList(ACCESSORY_COLORS, nextRandomValue);
  const accessoryKind = pickFromList(ACCESSORY_KINDS, nextRandomValue);

  const svgParts: string[] = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">',
    `<rect width="600" height="600" fill="${backgroundColor}" />`,

    /* Orelhas */
    `<circle cx="185" cy="230" r="70" fill="${furColor}" />`,
    `<circle cx="415" cy="230" r="70" fill="${furColor}" />`,
    `<circle cx="185" cy="230" r="34" fill="${muzzleColor}" />`,
    `<circle cx="415" cy="230" r="34" fill="${muzzleColor}" />`,

    /* Cabeça */
    `<circle cx="300" cy="300" r="190" fill="${furColor}" />`,

    /* Focinho */
    `<ellipse cx="300" cy="360" rx="120" ry="100" fill="${muzzleColor}" />`,

    /* Olhos */
    `<circle cx="245" cy="290" r="16" fill="#241812" />`,
    `<circle cx="355" cy="290" r="16" fill="#241812" />`,

    /* Narina e boca */
    `<ellipse cx="285" cy="365" rx="8" ry="6" fill="#241812" />`,
    `<ellipse cx="315" cy="365" rx="8" ry="6" fill="#241812" />`,
    '<path d="M265 405 Q300 425 335 405" stroke="#241812" stroke-width="6" fill="none" stroke-linecap="round" />',
  ];

  if (accessoryKind === "sunglasses") {
    svgParts.push(
      `<rect x="215" y="265" width="80" height="40" rx="14" fill="${accessoryColor}" />`,
      `<rect x="305" y="265" width="80" height="40" rx="14" fill="${accessoryColor}" />`,
      `<rect x="295" y="278" width="10" height="8" fill="${accessoryColor}" />`,
    );
  } else if (accessoryKind === "hat") {
    svgParts.push(
      `<path d="M150 165 Q300 70 450 165 L450 195 L150 195 Z" fill="${accessoryColor}" />`,
      `<rect x="140" y="185" width="320" height="26" rx="13" fill="${accessoryColor}" />`,
    );
  } else if (accessoryKind === "headphones") {
    svgParts.push(
      `<path d="M160 235 A140 140 0 0 1 440 235" stroke="${accessoryColor}" stroke-width="18" fill="none" stroke-linecap="round" />`,
      `<rect x="145" y="215" width="46" height="60" rx="16" fill="${accessoryColor}" />`,
      `<rect x="409" y="215" width="46" height="60" rx="16" fill="${accessoryColor}" />`,
    );
  }

  svgParts.push("</svg>");

  return svgParts.join("");
};

const extractNftSeedsFromFixturesFile = () => {
  const fixturesFileContent = readFileSync(nftFixturesFilePath, "utf-8");
  const nftIdMatches = [...fixturesFileContent.matchAll(/createNftFixture\("([a-z0-9-]+)"/g)];

  const allSeeds = new Set<string>();

  for (const [, nftId] of nftIdMatches) {
    allSeeds.add(nftId);
    allSeeds.add(`${nftId}-2`);
    allSeeds.add(`${nftId}-3`);
    allSeeds.add(`${nftId}-4`);
  }

  return [...allSeeds];
};

const generateAllNftAvatarFiles = () => {
  mkdirSync(outputDirectoryPath, { recursive: true });

  const nftSeeds = extractNftSeedsFromFixturesFile();

  for (const seedText of nftSeeds) {
    const svgFileContent = createNftAvatarSvg(seedText);
    writeFileSync(resolve(outputDirectoryPath, `${seedText}.svg`), svgFileContent, "utf-8");
  }

  console.log(`Geradas ${nftSeeds.length} imagens em ${outputDirectoryPath}`);
};

generateAllNftAvatarFiles();
