import type { NFT } from "@/types";

/* - Gerado por scripts/generateNftAvatars.ts: retrato geométrico de macaco com acessório variável,
 *   determinístico por seed. Optamos por isso em vez de um serviço externo de fotos aleatórias
 *   (picsum.photos) porque este projeto não recebeu os assets ilustrados originais do Figma para
 *   cada NFT — ver ARCHITECTURE.md. - */

const nftReferenceImages: Record<string, string> = {
  "emerald-ape-042": "/images/nfts/emerald-ape-042.png",
  "sage-nomad-009": "/images/nfts/sage-nomad-009.png",
  "neon-vessel-552": "/images/nfts/neon-vessel-552.png",
  "cosmic-bloom-118": "/images/nfts/sage-nomad-009.png",
  "violet-nomad-314": "/images/nfts/sage-nomad-009.png",
  "ivory-baron-088": "/images/nfts/neon-vessel-552.png",
  "golden-beat-207": "/images/nfts/golden-beat-207.png",
  "golden-signal-160": "/images/nfts/golden-beat-207.png",
  "crimson-scout-118": "/images/nfts/golden-beat-207.png",
};

const fallbackReferenceOrder = Object.values(nftReferenceImages);

const createNftImageUrl = (seed: string) => nftReferenceImages[seed] ?? fallbackReferenceOrder[seed.length % fallbackReferenceOrder.length];

const createNftFixture = (
  id: string,
  name: string,
  collectionId: string,
  collectionName: string,
  priceEth: string,
  editionCurrent: number,
  editionTotal: number,
  tags: NFT["tags"],
  rating: number,
  reviewCount: number,
  status: "available" | "sold_out" = "available",
  originalPriceEth?: string,
): NFT => {
  return {
    id,
    slug: id,
    name,
    collection: collectionName,
    collectionId,
    image: createNftImageUrl(id),
    gallery: [
      createNftImageUrl(id),
      fallbackReferenceOrder[(id.length + 1) % fallbackReferenceOrder.length],
      fallbackReferenceOrder[(id.length + 3) % fallbackReferenceOrder.length],
      fallbackReferenceOrder[(id.length + 5) % fallbackReferenceOrder.length],
    ],
    description: `Um colecionável digital ${editionCurrent}/${editionTotal} finalizado à mão da coleção ${collectionName}, verificado na Ethereum.`,
    priceEth,
    originalPriceEth,
    edition: { current: editionCurrent, total: editionTotal, status },
    attributes: [
      { trait: "Óculos", value: "Redondo" },
      { trait: "Fundo", value: "Estúdio" },
      { trait: "Raridade", value: tags.includes("raro") ? "Raro" : "Comum" },
    ],
    rating,
    reviewCount,
    tags,
    creator: { id: "kurio-studio", name: "Kurio Studio", avatar: createNftImageUrl("creator-kurio") },
    version: 1,
    availableQuantity: status === "sold_out" ? 0 : 10,
    maxQuantityPerOrder: 10,
    createdAt: new Date(Date.now() - editionCurrent * 86400000).toISOString(),
  };
};

/* - Fixtures cobrem preços, tags, edições, coleções, ordenação e paginação. - */

const nftFixtures: NFT[] = [
  createNftFixture("emerald-ape-042", "Emerald Ape #042", "kurio-apes", "Kurio Apes", "1.19", 1, 50, ["em-alta"], 4.8, 19),
  createNftFixture("sage-nomad-009", "Sage Nomad #009", "kurio-apes", "Kurio Apes", "1.69", 1, 30, ["novo"], 4.5, 8),
  createNftFixture("neon-vessel-552", "Neon Vessel #552", "kurio-apes", "Kurio Apes", "1.99", 1, 20, [], 4.6, 13, "available", "2.29"),
  createNftFixture("cosmic-bloom-118", "Cosmic Bloom #118", "kurio-apes", "Kurio Apes", "1.29", 1, 15, [], 4.4, 10),
  createNftFixture("violet-nomad-314", "Violet Nomad #314", "kurio-apes", "Kurio Apes", "1.39", 1, 1, ["raro"], 4.9, 32),
  createNftFixture("ivory-baron-088", "Ivory Baron #088", "kurio-apes", "Kurio Apes", "1.79", 1, 10, ["raro"], 4.7, 14),
  createNftFixture("golden-beat-207", "Golden Beat #207", "kurio-apes", "Kurio Apes", "0.99", 1, 50, ["em-alta"], 4.6, 21),
  createNftFixture("golden-signal-160", "Golden Signal #160", "kurio-apes", "Kurio Apes", "0.39", 1, 50, [], 4.4, 12),
  createNftFixture("crimson-scout-118", "Crimson Scout #118", "kurio-apes", "Kurio Apes", "0.42", 3, 80, [], 4.1, 5),
  createNftFixture("azure-monk-061", "Azure Monk #061", "kurio-apes", "Kurio Apes", "2.10", 1, 20, ["novo"], 4.3, 3),
  createNftFixture("obsidian-duke-005", "Obsidian Duke #005", "kurio-editions", "Kurio Editions", "12.00", 1, 1, ["raro"], 5.0, 47),
  createNftFixture("amber-nomad-273", "Amber Nomad #273", "kurio-apes", "Kurio Apes", "0.85", 12, 60, [], 3.9, 11),
  createNftFixture("cobalt-baron-142", "Cobalt Baron #142", "kurio-editions", "Kurio Editions", "4.25", 2, 15, ["em-alta"], 4.4, 9),
  createNftFixture("jade-scout-330", "Jade Scout #330", "kurio-apes", "Kurio Apes", "0.65", 22, 40, [], 4.0, 6),
  createNftFixture("ruby-duke-019", "Ruby Duke #019", "kurio-editions", "Kurio Editions", "7.80", 1, 5, ["raro"], 4.9, 28),
  createNftFixture("pearl-nomad-451", "Pearl Nomad #451", "kurio-apes", "Kurio Apes", "1.05", 5, 25, ["novo"], 4.2, 4),
  createNftFixture("slate-monk-076", "Slate Monk #076", "kurio-apes", "Kurio Apes", "0.55", 40, 40, [], 3.7, 2, "sold_out"),
  createNftFixture("copper-baron-233", "Copper Baron #233", "kurio-editions", "Kurio Editions", "3.15", 1, 12, [], 4.3, 7),
  createNftFixture("ivory-scout-198", "Ivory Scout #198", "kurio-apes", "Kurio Apes", "0.99", 8, 35, ["em-alta"], 4.5, 16),
  createNftFixture("onyx-nomad-087", "Onyx Nomad #087", "kurio-apes", "Kurio Apes", "2.75", 1, 8, ["raro"], 4.8, 22),
  createNftFixture("topaz-duke-410", "Topaz Duke #410", "kurio-editions", "Kurio Editions", "5.60", 1, 6, [], 4.1, 5),
  createNftFixture("coral-monk-059", "Coral Monk #059", "kurio-apes", "Kurio Apes", "0.48", 18, 45, ["novo"], 3.8, 3),
  createNftFixture("indigo-scout-144", "Indigo Scout #144", "kurio-apes", "Kurio Apes", "1.85", 3, 20, [], 4.4, 10),
  createNftFixture("quartz-baron-302", "Quartz Baron #302", "kurio-editions", "Kurio Editions", "6.40", 1, 4, ["raro"], 4.9, 31),
  createNftFixture("lilac-nomad-021", "Lilac Nomad #021", "kurio-apes", "Kurio Apes", "0.72", 14, 30, [], 3.9, 4),
  createNftFixture("bronze-duke-266", "Bronze Duke #266", "kurio-editions", "Kurio Editions", "9.90", 1, 3, ["em-alta"], 4.7, 18),
  createNftFixture("mint-scout-388", "Mint Scout #388", "kurio-apes", "Kurio Apes", "1.29", 0, 15, [], 4.0, 6, "sold_out"),
  createNftFixture("forest-ape-101", "Forest Ape #101", "kurio-apes", "Kurio Apes", "1.15", 4, 40, [], 4.2, 7),
  createNftFixture("sand-nomad-202", "Sand Nomad #202", "kurio-apes", "Kurio Apes", "1.45", 6, 30, ["novo"], 4.1, 6),
  createNftFixture("shadow-vessel-303", "Shadow Vessel #303", "kurio-apes", "Kurio Apes", "2.25", 2, 20, [], 4.5, 9),
  createNftFixture("peach-bloom-404", "Peach Bloom #404", "kurio-apes", "Kurio Apes", "1.25", 5, 25, [], 4.0, 5),
  createNftFixture("olive-nomad-505", "Olive Nomad #505", "kurio-apes", "Kurio Apes", "1.55", 3, 18, ["raro"], 4.6, 12),
  createNftFixture("midnight-baron-606", "Midnight Baron #606", "kurio-apes", "Kurio Apes", "2.05", 1, 12, [], 4.3, 8),
  createNftFixture("copper-beat-707", "Copper Beat #707", "kurio-apes", "Kurio Apes", "0.89", 9, 50, ["em-alta"], 4.2, 10),
  createNftFixture("sunset-signal-808", "Sunset Signal #808", "kurio-apes", "Kurio Apes", "0.49", 7, 50, [], 4.1, 4),
  createNftFixture("crimson-gem-909", "Crimson Gem #909", "kurio-editions", "Kurio Editions", "3.40", 1, 10, ["novo"], 4.5, 11),
];

export { nftFixtures };
