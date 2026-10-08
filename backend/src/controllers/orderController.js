import mongoose from "mongoose";
import Order, { EMAIL_STATUS, ORDER_STATUS, generateOrderNumber } from "../models/Order.js";
import SiteSettings from "../models/SiteSettings.js";
import { sendMail } from "../services/mailer.js";
import { businessOrderEmail, customerConfirmationEmail } from "../services/orderEmails.js";
import { quoteCart } from "../services/orderPricing.js";
import ApiError from "../utils/ApiError.js";
import { isProfileComplete } from "../utils/profile.js";

const ORDER_NUMBER_ATTEMPTS = 5;

/** Public: prices a cart so the storefront shows authoritative totals before sign-in. */
export async function quote(req, res) {
  res.json({ success: true, data: await quoteCart(req.body?.items) });
}

async function deliver(order, target) {
  const settings = await SiteSettings.getSingleton();
  const businessInbox = settings.orderDestinationEmail;

  const message =
    target === "business"
      ? { to: businessInbox, ...businessOrderEmail(order) }
      : { to: order.customer.email, ...customerConfirmationEmail(order, { replyTo: businessInbox || undefined }) };

  if (!message.to) {
    console.error(`[orders] ${order.orderNumber}: no order destination email is configured in Site settings`);
    order.emails[target] = { status: EMAIL_STATUS.FAILED, error: "No order destination email configured" };
    return;
  }

  try {
    const result = await sendMail(message);
    order.emails[target] = {
      status: result.status,
      to: message.to,
      error: result.detail,
      sentAt: result.status === EMAIL_STATUS.SENT ? new Date() : undefined,
    };
  } catch (err) {
    console.error(`[orders] ${order.orderNumber}: ${target} email to ${message.to} failed:`, err.message);
    order.emails[target] = { status: EMAIL_STATUS.FAILED, to: message.to, error: err.message.slice(0, 300) };
  }
}

async function createWithUniqueNumber(fields) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await Order.create({ ...fields, orderNumber: generateOrderNumber() });
    } catch (err) {
      const numberClash = err?.code === 11000 && err.keyPattern?.orderNumber;
      if (!numberClash || attempt >= ORDER_NUMBER_ATTEMPTS) throw err;
    }
  }
}

const toBuyerView = (order) => {
  const json = order.toJSON();
  return {
    ...json,
    emails: { customer: { status: json.emails?.customer?.status } },
  };
};

export async function createOrder(req, res) {
  const user = req.user;
  const idempotencyKey =
    typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey.slice(0, 100) : undefined;

  if (idempotencyKey) {
    const existing = await Order.findOne({ user: user._id, idempotencyKey });
    if (existing) return res.json({ success: true, data: toBuyerView(existing) });
  }

  if (!isProfileComplete(user)) {
    throw ApiError.badRequest(
      "Please add your phone number, company name and shipping address to your account before ordering",
      { profile: "incomplete" }
    );
  }

  const priced = await quoteCart(req.body?.items);
  if (priced.issues.length) {
    throw ApiError.badRequest(
      "Some items in your order need attention",
      Object.fromEntries(priced.issues.map((issue) => [issue.productId, issue.message]))
    );
  }

  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim().slice(0, 1000) : "";
  const business = user.business ?? {};

  let order;
  try {
    order = await createWithUniqueNumber({
      user: user._id,
      idempotencyKey,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: business.companyName,
        gstin: business.gstin,
        businessType: business.businessType,
        shippingAddress: business.shippingAddress?.toObject?.() ?? business.shippingAddress,
      },
      items: priced.lines.map((line) => ({
        product: line.productId,
        title: line.title,
        sku: line.sku,
        slug: line.slug,
        image: line.image,
        unit: line.unit,
        quantity: line.quantity,
        basePrice: line.basePrice,
        discountPercentage: line.discountPercentage,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      itemCount: priced.itemCount,
      totalQuantity: priced.totalQuantity,
      subtotal: priced.subtotal,
      notes,
    });
  } catch (err) {
    // Two identical submits raced past the lookup above; return the one that won.
    if (err?.code === 11000 && err.keyPattern?.idempotencyKey) {
      const existing = await Order.findOne({ user: user._id, idempotencyKey });
      if (existing) return res.json({ success: true, data: toBuyerView(existing) });
    }
    throw err;
  }

  // The order is saved before any email goes out, so a mail outage never loses an order.
  await Promise.all([deliver(order, "business"), deliver(order, "customer")]);
  await order.save();

  res.status(201).json({ success: true, data: toBuyerView(order) });
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("-emails -idempotencyKey -user");
  res.json({ success: true, data: orders });
}

/* ---------- Admin ---------- */

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listOrders(req, res) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};

  if (Object.values(ORDER_STATUS).includes(req.query.status)) filter.status = req.query.status;

  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { orderNumber: pattern },
      { "customer.companyName": pattern },
      { "customer.email": pattern },
      { "customer.name": pattern },
      { "customer.phone": pattern },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("-idempotencyKey"),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
}

async function findOrderOr404(id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound("Order not found");
  const order = await Order.findById(id).select("-idempotencyKey");
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function getOrder(req, res) {
  res.json({ success: true, data: await findOrderOr404(req.params.id) });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body ?? {};
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw ApiError.badRequest(`Status must be one of: ${Object.values(ORDER_STATUS).join(", ")}`);
  }
  const order = await findOrderOr404(req.params.id);
  order.status = status;
  await order.save();
  res.json({ success: true, data: order });
}

export async function resendOrderEmail(req, res) {
  const target = req.body?.target === "customer" ? "customer" : "business";
  const order = await findOrderOr404(req.params.id);
  await deliver(order, target);
  await order.save();
  res.json({ success: true, data: order });
}
