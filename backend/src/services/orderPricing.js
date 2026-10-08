import mongoose from "mongoose";
import Product, { STOCK_STATUS } from "../models/Product.js";
import ApiError from "../utils/ApiError.js";

export const MAX_LINES = 100;
export const MAX_QUANTITY = 1_000_000;

const roundMoney = (value) => Math.round(value * 100) / 100;

/** Parses `[{ productId, quantity }]`, merging repeated products. Throws 400 on malformed input. */
export function parseCartItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) throw ApiError.badRequest("Your order has no items");
  if (raw.length > MAX_LINES) throw ApiError.badRequest(`An order can contain at most ${MAX_LINES} products`);

  const merged = new Map();
  for (const item of raw) {
    const productId = String(item?.productId ?? "");
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(productId)) throw ApiError.badRequest("Your order contains an invalid product");
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.badRequest("Quantities must be whole numbers of at least 1");
    }
    merged.set(productId, Math.min((merged.get(productId) ?? 0) + quantity, MAX_QUANTITY));
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Prices a cart from the database; the client's idea of price is never trusted.
 * Returns every line it could price plus a list of problems that would block an order.
 */
export async function quoteCart(rawItems) {
  const items = parseCartItems(rawItems);
  const products = await Product.find({ _id: { $in: items.map((item) => item.productId) }, isActive: true }).select(
    "title slug sku basePrice discountPercentage finalPrice images stockStatus minOrderQty unit"
  );
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const lines = [];
  const issues = [];

  for (const { productId, quantity } of items) {
    const product = byId.get(productId);
    if (!product) {
      issues.push({ productId, code: "unavailable", message: "This product is no longer available" });
      continue;
    }

    if (product.stockStatus === STOCK_STATUS.OUT_OF_STOCK) {
      issues.push({ productId, code: "out_of_stock", message: `${product.title} is currently out of stock` });
    } else if (quantity < product.minOrderQty) {
      issues.push({
        productId,
        code: "below_minimum",
        message: `Minimum order for ${product.title} is ${product.minOrderQty.toLocaleString("en-IN")} ${product.unit}`,
      });
    }

    lines.push({
      productId,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      image: product.images[0]?.url ?? "",
      unit: product.unit,
      minOrderQty: product.minOrderQty,
      stockStatus: product.stockStatus,
      basePrice: product.basePrice,
      discountPercentage: product.discountPercentage,
      unitPrice: product.finalPrice,
      quantity,
      lineTotal: roundMoney(product.finalPrice * quantity),
    });
  }

  return {
    lines,
    issues,
    itemCount: lines.length,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
  };
}
