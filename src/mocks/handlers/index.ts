import { authenticationHandlers } from "./authentication";
import { cartHandlers } from "./cart";
import { devHandlers } from "./dev";
import { favoriteHandlers } from "./favorites";
import { nftHandlers } from "./nfts";
import { orderHandlers } from "./orders";
import { profileHandlers } from "./profile";
import { walletHandlers } from "./wallets";

export const handlers = [
  ...authenticationHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...devHandlers,
];
