import mongoose from "mongoose";
import Product, { STOCK_STATUS, normalizeTag } from "../models/Product.js";
import { ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import pick from "../utils/pick.js";
import { removeUnusedUploads } from "../services/uploadCleanup.js";
import { CACHE_TAGS, revalidateStorefront } from "../services/storefrontRevalidate.js";

const EDITABLE_FIELDS = [
  "title",
  "description",
  "sku",
  "basePrice",
  "discountPercentage",
  "images",
  "tags",
  "stockStatus",
  "minOrderQty",
  "unit",
  "isActive",
];

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { finalPrice: 1, createdAt: -1 },
  price_desc: { finalPrice: -1, createdAt: -1 },
  discount: { discountPercentage: -1, createdAt: -1 },
  title: { title: 1 },
};

const MAX_PAGE_SIZE = 100;

const isAdmin = (req) => req.user?.role === ROLES.ADMIN;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseTags(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(list.map(normalizeTag).filter(Boolean))];
}

function sanitizeImages(images) {
  if (!Array.isArray(images)) return images;
  return images
    .map((image) => (typeof image === "string" ? { url: image } : image))
    .filter((image) => image && typeof image.url === "string" && image.url.trim())
    .map(({ url, alt }) => ({ url: url.trim(), alt: alt?.trim() || undefined }));
}

function readPayload(body) {
  const payload = pick(body, EDITABLE_FIELDS);
  if ("images" in payload) payload.images = sanitizeImages(payload.images);
  return payload;
}

async function findProductOr404(idOrSlug, { includeInactive }) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  if (!includeInactive) filter.isActive = true;
  const product = await Product.findOne(filter);
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function listProducts(req, res) {
  const { q, sort = "newest", match = "any", stockStatus, status } = req.query;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), MAX_PAGE_SIZE);
  const tags = parseTags(req.query.tags ?? req.query.tag);

  const filter = {};

  if (isAdmin(req) && status === "inactive") filter.isActive = false;
  else if (!(isAdmin(req) && status === "all")) filter.isActive = true;

  if (tags.length) filter.tags = match === "all" ? { $all: tags } : { $in: tags };

  if (stockStatus && Object.values(STOCK_STATUS).includes(stockStatus)) {
    filter.stockStatus = stockStatus;
  }

  if (q && String(q).trim()) {
    const pattern = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ title: pattern }, { sku: pattern }, { tags: pattern }];
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
}

export async function listTags(req, res) {
  const match = isAdmin(req) && req.query.status === "all" ? {} : { isActive: true };
  const tags = await Product.aggregate([
    { $match: match },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);
  res.json({ success: true, data: tags });
}

export async function getProduct(req, res) {
  const product = await findProductOr404(req.params.idOrSlug, { includeInactive: isAdmin(req) });
  res.json({ success: true, data: product });
}

export async function createProduct(req, res) {
  const product = await Product.create(readPayload(req.body));
  revalidateStorefront([CACHE_TAGS.PRODUCTS, CACHE_TAGS.product(product.slug)]);
  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req, res) {
  const product = await findProductOr404(req.params.id, { includeInactive: true });
  const previousImages = product.images.map((image) => image.url);
  const previousSlug = product.slug;

  product.set(readPayload(req.body));
  await product.save();

  const currentImages = new Set(product.images.map((image) => image.url));
  await removeUnusedUploads(previousImages.filter((url) => !currentImages.has(url)));
  revalidateStorefront([
    CACHE_TAGS.PRODUCTS,
    CACHE_TAGS.product(previousSlug),
    CACHE_TAGS.product(product.slug),
  ]);

  res.json({ success: true, data: product });
}

export async function deleteProduct(req, res) {
  const product = await findProductOr404(req.params.id, { includeInactive: true });
  await product.deleteOne();
  await removeUnusedUploads(product.images.map((image) => image.url));
  revalidateStorefront([CACHE_TAGS.PRODUCTS, CACHE_TAGS.product(product.slug)]);
  res.json({ success: true, data: { _id: product._id } });
}
