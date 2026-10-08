import crypto from "node:crypto";
import mongoose from "mongoose";

export const ORDER_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
  DISPATCHED: "dispatched",
  CANCELLED: "cancelled",
});

export const EMAIL_STATUS = Object.freeze({ PENDING: "pending", SENT: "sent", FAILED: "failed", SKIPPED: "skipped" });

/* Line items and the customer block are snapshots: later edits to products or the buyer's profile
   must not change what was ordered. */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    slug: String,
    image: String,
    unit: { type: String, default: "pcs" },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const emailDeliverySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(EMAIL_STATUS), default: EMAIL_STATUS.PENDING },
    to: String,
    error: String,
    sentAt: Date,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Client-generated per checkout attempt, so a retried submit returns the same order. */
    idempotencyKey: { type: String, maxlength: 100 },
    customer: {
      name: String,
      email: String,
      phone: String,
      companyName: String,
      gstin: String,
      businessType: String,
      shippingAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
    items: { type: [orderItemSchema], validate: [(items) => items.length > 0, "An order needs at least one item"] },
    itemCount: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.SUBMITTED, index: true },
    emails: {
      business: { type: emailDeliverySchema, default: () => ({}) },
      customer: { type: emailDeliverySchema, default: () => ({}) },
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
orderSchema.index({ createdAt: -1 });

/** e.g. CC-261008-7KQ4M: date for humans on the phone, random suffix so numbers can't be guessed. */
export function generateOrderNumber(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from(crypto.randomBytes(5), (byte) => alphabet[byte % alphabet.length]).join("");
  return `CC-${stamp}-${suffix}`;
}

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
