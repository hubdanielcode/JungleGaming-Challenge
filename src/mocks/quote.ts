import { decimal } from "@/lib/decimal";
import type { Cart, Quote } from "@/types";
import { mockDatabase } from "./db";
import { couponFixtures } from "./fixtures/users";

const computeCartQuote = (cart: Cart): Quote => {
  let subtotalEth = "0";
  let quoteIsStale = false;

  for (const cartItem of cart.items) {
    const currentNft = mockDatabase.state.nfts.find((nft) => nft.id === cartItem.nftId);
    if (!currentNft) {
      quoteIsStale = true;
      continue;
    }

    if (
      currentNft.priceEth !== cartItem.unitPriceEth ||
      currentNft.edition.status === "sold_out" ||
      currentNft.availableQuantity < cartItem.quantity
    ) {
      quoteIsStale = true;
    }

    subtotalEth = decimal.add(subtotalEth, decimal.multiplyByInteger(cartItem.unitPriceEth, cartItem.quantity));
  }

  let discountEth = "0";
  let couponStatus: Quote["couponStatus"] = null;

  if (cart.couponCode) {
    const couponFixture = couponFixtures.find((coupon) => coupon.code === cart.couponCode);

    if (!couponFixture) {
      couponStatus = "invalid";
    } else if (couponFixture.status === "expired") {
      couponStatus = "expired";
    } else {
      couponStatus = "applied";
      discountEth = couponFixture.kind === "percent" ? decimal.multiplyByRatio(subtotalEth, Number(couponFixture.value), 100) : couponFixture.value;

      if (decimal.compare(discountEth, subtotalEth) === 1) {
        discountEth = subtotalEth;
      }
    }
  }

  const subtotalAfterDiscountEth = decimal.subtract(subtotalEth, discountEth);
  const networkFeeEth = "0.016";
  const totalEth = decimal.add(subtotalAfterDiscountEth, networkFeeEth);

  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponCode: cart.couponCode,
    couponStatus,
    stale: quoteIsStale,
    expiresAt: new Date(Date.now() + 2 * 60000).toISOString(),
  };
};

export { computeCartQuote };
