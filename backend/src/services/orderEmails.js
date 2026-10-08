import env from "../config/env.js";

const C = {
  canvas: "#f4f1ec",
  surface: "#ffffff",
  line: "#e8e3db",
  ink: "#1a1714",
  muted: "#6b645c",
  brand: "#1f4d3a",
  clay: "#c0532b",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(value);

const qty = (value) => new Intl.NumberFormat("en-IN").format(value);

const unitLabel = (unit) => (!unit || unit === "pcs" ? "pc" : unit);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(date);

function addressLines(address = {}) {
  return [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` ${address.postalCode}` : ""),
    address.country,
  ].filter((line) => line && line.trim());
}

function productUrl(item) {
  return item.slug ? `${env.storefrontUrl}/products/${encodeURIComponent(item.slug)}` : null;
}

function itemsTable(order) {
  const rows = order.items
    .map((item) => {
      const url = productUrl(item);
      const title = url
        ? `<a href="${escapeHtml(url)}" style="color:${C.ink};text-decoration:none;font-weight:600">${escapeHtml(item.title)}</a>`
        : `<span style="font-weight:600">${escapeHtml(item.title)}</span>`;
      const discount =
        item.discountPercentage > 0
          ? `<br><span style="color:${C.clay};font-size:12px">${escapeHtml(item.discountPercentage)}% off ${money(item.basePrice)}</span>`
          : "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:top">
            ${title}<br>
            <span style="color:${C.muted};font-size:12px">SKU ${escapeHtml(item.sku)}</span>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid ${C.line};vertical-align:top;text-align:right;white-space:nowrap">
            ${qty(item.quantity)} ${escapeHtml(item.unit)}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid ${C.line};vertical-align:top;text-align:right;white-space:nowrap">
            ${money(item.unitPrice)}<span style="color:${C.muted};font-size:12px"> / ${escapeHtml(unitLabel(item.unit))}</span>${discount}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:top;text-align:right;white-space:nowrap;font-weight:600">
            ${money(item.lineTotal)}
          </td>
        </tr>`;
    })
    .join("");

  const th = `padding:0 0 8px;color:${C.muted};font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-bottom:1px solid ${C.line}`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:${C.ink}">
      <thead>
        <tr>
          <th align="left" style="${th}">Product</th>
          <th align="right" style="${th};padding-left:8px;padding-right:8px">Qty</th>
          <th align="right" style="${th};padding-left:8px;padding-right:8px">Unit price</th>
          <th align="right" style="${th}">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:16px 8px 0 0;text-align:right;font-weight:600">
            Order total <span style="color:${C.muted};font-weight:400;font-size:12px">(${order.itemCount} ${order.itemCount === 1 ? "product" : "products"}, ${qty(order.totalQuantity)} units)</span>
          </td>
          <td style="padding:16px 0 0;text-align:right;font-size:18px;font-weight:700;white-space:nowrap">${money(order.subtotal)}</td>
        </tr>
      </tfoot>
    </table>`;
}

function detailBlock(title, lines) {
  return `
    <td valign="top" style="padding:0 12px 0 0;font-size:14px;line-height:1.55;color:${C.ink}">
      <div style="color:${C.muted};font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:6px">${escapeHtml(title)}</div>
      ${lines.join("<br>")}
    </td>`;
}

function layout({ preheader, heading, intro, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.canvas};font-family:${FONT}">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas}">
    <tr>
      <td align="center" style="padding:32px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px">
          <tr>
            <td style="padding:0 4px 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:${C.ink}">
              ${escapeHtml(env.storeName)}<span style="color:${C.clay}">.</span>
            </td>
          </tr>
          <tr>
            <td style="background:${C.surface};border:1px solid ${C.line};border-radius:14px;padding:28px 24px">
              <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:600;color:${C.ink}">${escapeHtml(heading)}</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${C.muted}">${intro}</p>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px;font-size:12px;line-height:1.5;color:${C.muted}">
              Prices are per unit as listed at the time of ordering. Taxes and delivery charges, if any, are confirmed with your invoice.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function customerDetails(order) {
  const c = order.customer;
  const contact = [
    `<strong>${escapeHtml(c.name)}</strong>`,
    `<a href="mailto:${escapeHtml(c.email)}" style="color:${C.brand}">${escapeHtml(c.email)}</a>`,
    `<a href="tel:${escapeHtml(c.phone.replace(/[^\d+]/g, ""))}" style="color:${C.brand}">${escapeHtml(c.phone)}</a>`,
  ];
  const business = [
    `<strong>${escapeHtml(c.companyName)}</strong>`,
    c.businessType && escapeHtml(c.businessType),
    c.gstin && `GSTIN ${escapeHtml(c.gstin)}`,
  ].filter(Boolean);
  const address = addressLines(c.shippingAddress).map(escapeHtml);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        ${detailBlock("Contact", contact)}
        ${detailBlock("Business", business)}
        ${detailBlock("Ship to", address)}
      </tr>
    </table>`;
}

function notesBlock(order) {
  if (!order.notes) return "";
  return `
    <div style="margin-top:24px;padding:14px 16px;background:${C.canvas};border-radius:10px;font-size:14px;line-height:1.55;color:${C.ink}">
      <div style="color:${C.muted};font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:4px">Buyer notes</div>
      ${escapeHtml(order.notes).replace(/\n/g, "<br>")}
    </div>`;
}

function textSummary(order) {
  const c = order.customer;
  const lines = order.items.map(
    (item) => `- ${item.title} (SKU ${item.sku}): ${qty(item.quantity)} ${item.unit} x ${money(item.unitPrice)} = ${money(item.lineTotal)}`
  );
  return [
    `Order ${order.orderNumber} — ${formatDate(order.createdAt)}`,
    "",
    ...lines,
    "",
    `Order total: ${money(order.subtotal)}`,
    "",
    `Contact: ${c.name}, ${c.email}, ${c.phone}`,
    `Business: ${c.companyName}${c.gstin ? `, GSTIN ${c.gstin}` : ""}`,
    `Ship to: ${addressLines(c.shippingAddress).join(", ")}`,
    order.notes ? `\nNotes: ${order.notes}` : "",
  ].join("\n");
}

/** Sent to SiteSettings.orderDestinationEmail. Reply goes straight to the buyer. */
export function businessOrderEmail(order) {
  const c = order.customer;
  return {
    subject: `New order ${order.orderNumber} — ${c.companyName} (${money(order.subtotal)})`,
    replyTo: { name: c.name, address: c.email },
    text: textSummary(order),
    html: layout({
      preheader: `${c.companyName} ordered ${order.itemCount} products totalling ${money(order.subtotal)}.`,
      heading: `New order ${order.orderNumber}`,
      intro: `Placed ${escapeHtml(formatDate(order.createdAt))} by ${escapeHtml(c.companyName)}. Reply to this email to contact the buyer directly.`,
      body: customerDetails(order) + itemsTable(order) + notesBlock(order),
    }),
  };
}

/** Confirmation to the buyer. Reply goes to the business inbox. */
export function customerConfirmationEmail(order, { replyTo } = {}) {
  const firstName = order.customer.name.split(" ")[0];
  return {
    subject: `We've received your order ${order.orderNumber}`,
    replyTo,
    text: `Hi ${firstName},\n\nThanks for your order. Our team will contact you shortly to confirm stock, invoicing and dispatch. No payment has been taken.\n\n${textSummary(order)}`,
    html: layout({
      preheader: `Order ${order.orderNumber} for ${money(order.subtotal)} has been received.`,
      heading: "Thanks — your order is in",
      intro: `Hi ${escapeHtml(firstName)}, we've received order <strong style="color:${C.ink}">${escapeHtml(order.orderNumber)}</strong>. Our team will contact you shortly to confirm stock, invoicing and dispatch. No payment has been taken.`,
      body:
        itemsTable(order) +
        notesBlock(order) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>${detailBlock(
          "Delivering to",
          [escapeHtml(order.customer.companyName), ...addressLines(order.customer.shippingAddress).map(escapeHtml)]
        )}</tr></table>` +
        `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${C.muted}">Need to change something? Just reply to this email.</p>`,
    }),
  };
}
