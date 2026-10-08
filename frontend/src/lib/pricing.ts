import { siteConfig } from "@/config/site";

/** Mirrors calculateFinalPrice in backend/src/models/Product.js. */
export function calculateFinalPrice(basePrice: number, discountPercentage = 0) {
  const discount = Math.min(Math.max(discountPercentage, 0), 100);
  return Math.round(basePrice * (1 - discount / 100) * 100) / 100;
}

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number) {
  return priceFormatter.format(amount);
}
