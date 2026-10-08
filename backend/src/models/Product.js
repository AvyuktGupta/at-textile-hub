import mongoose from "mongoose";

export const STOCK_STATUS = Object.freeze({
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  MADE_TO_ORDER: "made_to_order",
});

export function calculateFinalPrice(basePrice, discountPercentage = 0) {
  const price = Number(basePrice) || 0;
  const discount = Math.min(Math.max(Number(discountPercentage) || 0, 0), 100);
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

export function normalizeTag(tag) {
  return String(tag).trim().toLowerCase().replace(/\s+/g, "-");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 160 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 64,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    // Derived from basePrice and discountPercentage on every save; never set directly.
    finalPrice: { type: Number, min: 0 },
    images: { type: [imageSchema], default: [] },
    tags: {
      type: [String],
      default: [],
      set: (tags) => [...new Set((tags || []).map(normalizeTag).filter(Boolean))],
    },
    stockStatus: {
      type: String,
      enum: Object.values(STOCK_STATUS),
      default: STOCK_STATUS.IN_STOCK,
    },
    // Wholesale ordering rules
    minOrderQty: { type: Number, default: 1, min: 1 },
    unit: { type: String, trim: true, default: "pcs", maxlength: 20 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
  }
);

productSchema.index({ tags: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: "text", description: "text", sku: "text", tags: "text" });

productSchema.virtual("hasDiscount").get(function hasDiscount() {
  return this.discountPercentage > 0;
});

productSchema.virtual("savings").get(function savings() {
  return Math.round((this.basePrice - (this.finalPrice ?? this.basePrice)) * 100) / 100;
});

productSchema.pre("validate", function deriveFields() {
  this.finalPrice = calculateFinalPrice(this.basePrice, this.discountPercentage);
  if (!this.slug || this.isModified("title") || this.isModified("sku")) {
    this.slug = `${slugify(this.title)}-${slugify(this.sku || "")}`.replace(/-$/, "");
  }
});

// finalPrice depends on two fields, so partial query updates would leave it stale.
// Force callers to load the document and use save() instead.
function blockPriceQueryUpdates() {
  const update = this.getUpdate() || {};
  const fields = { ...update, ...(update.$set || {}) };
  if ("basePrice" in fields || "discountPercentage" in fields || "finalPrice" in fields) {
    throw new Error("Update product pricing with document.save() so finalPrice stays in sync");
  }
}

productSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], blockPriceQueryUpdates);

export default mongoose.models.Product || mongoose.model("Product", productSchema);
