import type { Cart, NFT, Order, User, Wallet } from "@/types";
import { nftFixtures } from "./fixtures/nfts";
import { userFixtures } from "./fixtures/users";

const mockDatabaseStorageKey = "kurio-mock-db-v2";

export interface StoredSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface MockDatabaseState {
  nfts: NFT[];
  usersById: Record<string, (typeof userFixtures)[number]>;
  sessionsByToken: Record<string, StoredSession>;
  favoritesByUser: Record<string, string[]>;
  cartsByOwner: Record<string, Cart>;
  walletsByUser: Record<string, Wallet[]>;
  ordersById: Record<string, Order>;
  orderIdByIdempotencyKey: Record<string, string>;
}

/* - Um carrinho recém-criado (visitante ou usuário autenticado) sempre nasce vazio. Semear itens automaticamente na primeira leitura já causou um item fantasma sendo mesclado na conta do usuário no login, o que violava tanto o requisito de carrinho vazio quanto o isolamento entre sessões (seção 11 do enunciado). Dados de demonstração devem ser inseridos por uma ação explícita (endpoint de cenário de dev), nunca como efeito colateral de uma leitura. - */

const createEmptyCart = (ownerKey: string): Cart => ({
  id: `cart-${ownerKey}`,
  items: [],
  couponCode: null,
  updatedAt: new Date().toISOString(),
});

const createInitialDatabaseState = (): MockDatabaseState => ({
  nfts: structuredClone(nftFixtures),
  usersById: Object.fromEntries(userFixtures.map((user) => [user.id, structuredClone(user)])),
  sessionsByToken: {},
  favoritesByUser: {},
  cartsByOwner: {},
  walletsByUser: {
    "user-andreza": [
      { id: "wallet-andreza-primary", kind: "primary", address: "0xA491F_E82C", network: "ethereum", provider: "metamask", label: "Principal" },
    ],
  },
  ordersById: {},
  orderIdByIdempotencyKey: {},
});

const loadDatabaseState = (): MockDatabaseState | null => {
  try {
    const stored = localStorage.getItem(mockDatabaseStorageKey);

    return stored ? (JSON.parse(stored) as MockDatabaseState) : null;
  } catch {
    return null;
  }
};

let databaseState: MockDatabaseState = loadDatabaseState() ?? createInitialDatabaseState();

const persistDatabaseState = () => {
  try {
    localStorage.setItem(mockDatabaseStorageKey, JSON.stringify(databaseState));
  } catch {
    /* - Persistência é best-effort: se o armazenamento local falhar (ex.: cota excedida), o estado em memória continua válido. - */
  }
};

const getPublicUser = (userId: string): User => {
  const user = databaseState.usersById[userId];
  return { id: user.id, email: user.email, username: user.username, avatar: user.avatar };
};

const getCart = (ownerKey: string): Cart => {
  const existing = databaseState.cartsByOwner[ownerKey];
  if (existing) {
    return existing;
  }

  const cart = createEmptyCart(ownerKey);
  databaseState.cartsByOwner[ownerKey] = cart;
  persistDatabaseState();

  return cart;
};

const mergeGuestCartIntoUser = (guestOwnerKey: string, userId: string) => {
  const guestCart = databaseState.cartsByOwner[guestOwnerKey];

  if (!guestCart || guestCart.items.length === 0) {
    return;
  }

  const userCart = getCart(userId);

  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find((userCartItem) => userCartItem.nftId === guestItem.nftId);

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + guestItem.quantity, existingItem.maxQuantity);
    } else {
      userCart.items.push(guestItem);
    }
  }

  userCart.updatedAt = new Date().toISOString();
  delete databaseState.cartsByOwner[guestOwnerKey];
  persistDatabaseState();
};

const mockDatabase = {
  get state() {
    return databaseState;
  },

  reset() {
    databaseState = createInitialDatabaseState();
    persistDatabaseState();
  },

  persist: persistDatabaseState,
  getPublicUser,
  getCart,
  mergeGuestCartIntoUser,
};

export { mockDatabase };
