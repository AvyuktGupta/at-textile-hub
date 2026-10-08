/**
 * Seeds a demo catalogue with generated illustrations so the storefront can be previewed.
 *   npm run seed:demo             create or update demo products (SKUs prefixed DEMO-)
 *   npm run seed:demo -- --remove delete them again
 */
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB, disconnectDB } from "../config/db.js";
import { UPLOADS_URL_PREFIX, uploadsDir } from "../config/paths.js";
import Product from "../models/Product.js";
import { removeUnusedUploads } from "../services/uploadCleanup.js";

const SKU_PREFIX = "DEMO-";

function cupSvg({ bg, body, band, rim = "#ffffff", shape = "tapered", ripple = false, label = "" }) {
  const shadow = `<ellipse cx="400" cy="672" rx="190" ry="26" fill="#000" opacity=".08"/>`;
  const text = label
    ? `<text x="400" y="470" font-family="Georgia, serif" font-size="44" fill="${rim}" text-anchor="middle" opacity=".9">${label}</text>`
    : "";

  let art;
  if (shape === "clear") {
    art = `
      <path d="M268 220 L532 220 L500 650 L300 650 Z" fill="${body}" fill-opacity=".35" stroke="${band}" stroke-width="5"/>
      <path d="M282 380 L518 380 L500 650 L300 650 Z" fill="${band}" fill-opacity=".55"/>
      <rect x="378" y="110" width="20" height="300" rx="8" fill="${rim}" transform="rotate(8 388 260)"/>
      <path d="M250 205 Q400 140 550 205 L550 228 L250 228 Z" fill="${body}" fill-opacity=".55" stroke="${band}" stroke-width="4"/>`;
  } else if (shape === "lid") {
    art = `
      <ellipse cx="400" cy="470" rx="230" ry="70" fill="${body}"/>
      <ellipse cx="400" cy="445" rx="230" ry="70" fill="${band}"/>
      <ellipse cx="400" cy="425" rx="170" ry="48" fill="${body}"/>
      <ellipse cx="400" cy="410" rx="120" ry="30" fill="${band}" opacity=".7"/>
      <rect x="430" y="392" width="46" height="14" rx="7" fill="${body}"/>`;
  } else if (shape === "bowl") {
    art = `
      <path d="M210 330 L590 330 L540 640 L260 640 Z" fill="${body}"/>
      <rect x="250" y="440" width="300" height="90" fill="${band}"/>
      <rect x="196" y="300" width="408" height="40" rx="14" fill="${rim}"/>`;
  } else {
    const ripples = ripple
      ? Array.from({ length: 12 }, (_, i) => {
          const x = 280 + i * 22;
          return `<path d="M${x} 250 L${x - (x - 400) * 0.25} 640" stroke="#000" stroke-opacity=".1" stroke-width="5"/>`;
        }).join("")
      : "";
    art = `
      <path d="M262 240 L538 240 L500 650 L300 650 Z" fill="${body}"/>
      ${ripples}
      <path d="M276 390 L524 390 L512 520 L288 520 Z" fill="${band}"/>
      <rect x="240" y="206" width="320" height="42" rx="12" fill="${rim}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${bg}"/>
  ${shadow}${art}${text}
</svg>`;
}

const DEMO_PRODUCTS = [
  {
    sku: "RWC-12-BLK", title: "Ripple-wall hot cup, 12 oz — matte black", basePrice: 8.9, discountPercentage: 10,
    tags: ["hot-cups", "ripple-wall", "popular"], minOrderQty: 500, stockStatus: "in_stock",
    description: "Triple-layer ripple wall keeps hands cool without a sleeve. 300 GSM board, food-grade PE lining. Fits 90 mm lids.\n\nCarton: 25 sleeves × 20 cups (500 pcs).",
    art: { bg: "#ece7df", body: "#2a2622", band: "#3d3832", rim: "#f4f1ec", ripple: true },
  },
  {
    sku: "DWC-08-WHT", title: "Double-wall hot cup, 8 oz — white", basePrice: 5.6, discountPercentage: 0,
    tags: ["hot-cups", "double-wall", "new"], minOrderQty: 1000, stockStatus: "in_stock",
    description: "Insulated double wall with a smooth print-ready outer surface. Ideal for cafés and QSR counters.\n\nCarton: 50 sleeves × 20 cups (1,000 pcs).",
    art: { bg: "#e7efea", body: "#ffffff", band: "#1f4d3a", rim: "#f4f1ec" },
  },
  {
    sku: "SWC-065-WHT", title: "Single-wall paper cup, 6.5 oz", basePrice: 1.35, discountPercentage: 8,
    tags: ["hot-cups", "single-wall", "popular"], minOrderQty: 2000, stockStatus: "in_stock",
    description: "Everyday tea and coffee cup. 210 GSM, PE coated, rolled rim for a firm lid seal.\n\nCarton: 40 sleeves × 50 cups (2,000 pcs).",
    art: { bg: "#f6efe6", body: "#fbfaf7", band: "#c0532b", rim: "#ffffff" },
  },
  {
    sku: "SWC-04-ESP", title: "Espresso cup, 4 oz — kraft", basePrice: 1.1, discountPercentage: 0,
    tags: ["hot-cups", "single-wall", "espresso"], minOrderQty: 2000, stockStatus: "low_stock",
    description: "Compact kraft cup for espresso shots and tasting counters. Unbleached board, water-based print.",
    art: { bg: "#efe7da", body: "#b98b5e", band: "#8f6640", rim: "#f4ebe0" },
  },
  {
    sku: "PET-12-CLR", title: "PET cold cup, 12 oz — crystal clear", basePrice: 3.2, discountPercentage: 12,
    tags: ["cold-cups", "pet", "popular"], minOrderQty: 1000, stockStatus: "in_stock",
    description: "High-clarity PET for iced coffee, shakes and juices. Crack-resistant, fits 98 mm dome and flat lids.\n\nCarton: 20 sleeves × 50 cups (1,000 pcs).",
    art: { bg: "#e6eef2", body: "#d8ecf4", band: "#8a5a3b", rim: "#ffffff", shape: "clear" },
  },
  {
    sku: "PET-16-CLR", title: "PET cold cup, 16 oz — crystal clear", basePrice: 3.9, discountPercentage: 0,
    tags: ["cold-cups", "pet", "new"], minOrderQty: 1000, stockStatus: "in_stock",
    description: "Tall 16 oz PET cup for bubble tea and smoothies. Pairs with 98 mm dome lids and 12 mm straws.",
    art: { bg: "#eef0e6", body: "#e3f0d8", band: "#7a9a3f", rim: "#ffffff", shape: "clear" },
  },
  {
    sku: "LID-98-DOME", title: "Dome lid with straw hole, 98 mm", basePrice: 1.05, discountPercentage: 5,
    tags: ["lids", "cold-cups"], minOrderQty: 2000, stockStatus: "in_stock",
    description: "Clear PET dome lid for 12–24 oz cold cups. Cross-cut straw slot and snug snap fit.",
    art: { bg: "#e9edf0", body: "#cfdde6", band: "#b5c8d4", shape: "lid" },
  },
  {
    sku: "LID-80-SIP", title: "Sip-through lid, 80 mm — black", basePrice: 0.95, discountPercentage: 0,
    tags: ["lids", "hot-cups"], minOrderQty: 2000, stockStatus: "in_stock",
    description: "Polystyrene sip lid for 8 oz hot cups. Raised drinking spout and vent hole.",
    art: { bg: "#ece7df", body: "#2a2622", band: "#4a443d", shape: "lid" },
  },
  {
    sku: "SOUP-16-KRF", title: "Kraft soup container, 16 oz", basePrice: 6.75, discountPercentage: 15,
    tags: ["food-containers", "new"], minOrderQty: 500, stockStatus: "in_stock",
    description: "Leak-resistant kraft container for soups, noodles and curries. Microwave-safe, vented paper lid sold separately.",
    art: { bg: "#f2ebe1", body: "#b98b5e", band: "#e6d3bb", rim: "#d8c2a3", shape: "bowl" },
  },
  {
    sku: "CUS-08-PRT", title: "Custom printed ripple cup, 8 oz", basePrice: 9.5, discountPercentage: 0,
    tags: ["custom-print", "hot-cups", "ripple-wall", "new"], minOrderQty: 5000, stockStatus: "made_to_order",
    description: "Your logo on a full-wrap ripple cup. Up to 6 Pantone colours, artwork proof within 48 hours. Lead time 3–4 weeks from approval.",
    art: { bg: "#fbede6", body: "#c0532b", band: "#fbfaf7", rim: "#fbede6", ripple: true, label: "Your brand" },
  },
  {
    sku: "ICE-04-WHT", title: "Ice-cream cup, 4 oz", basePrice: 1.6, discountPercentage: 20,
    tags: ["dessert-cups"], minOrderQty: 2000, stockStatus: "out_of_stock",
    description: "Squat paper cup for gelato, kulfi and desserts. Grease-resistant coating, matching lids available.",
    art: { bg: "#f8e9ec", body: "#fbfaf7", band: "#d97a8b", rim: "#ffffff", shape: "bowl" },
  },
  {
    sku: "BAG-08-NAT", title: "Bagasse hot cup, 8 oz — compostable", basePrice: 4.4, discountPercentage: 0,
    tags: ["eco-friendly", "hot-cups", "new"], minOrderQty: 1000, stockStatus: "in_stock",
    description: "Moulded sugarcane fibre, plastic-free and home-compostable. Handles hot drinks up to 95 °C.",
    art: { bg: "#eef0e6", body: "#e6dcc6", band: "#9aa86a", rim: "#f6f1e6" },
  },
];

async function seed() {
  await fs.mkdir(uploadsDir, { recursive: true });

  for (const { art, sku, ...fields } of DEMO_PRODUCTS) {
    const fullSku = `${SKU_PREFIX}${sku}`;
    const filename = `demo-${sku.toLowerCase()}.svg`;
    await fs.writeFile(path.join(uploadsDir, filename), cupSvg(art));

    const existing = await Product.findOne({ sku: fullSku });
    const product = existing ?? new Product({ sku: fullSku });
    product.set({
      ...fields,
      unit: "pcs",
      isActive: true,
      images: [{ url: `${UPLOADS_URL_PREFIX}/${filename}`, alt: fields.title }],
    });
    await product.save();
    console.log(`[demo] ${existing ? "updated" : "created"} ${fullSku}`);
  }
}

async function remove() {
  const products = await Product.find({ sku: new RegExp(`^${SKU_PREFIX}`) });
  await Product.deleteMany({ _id: { $in: products.map((p) => p._id) } });
  await removeUnusedUploads(products.flatMap((p) => p.images.map((image) => image.url)));
  console.log(`[demo] removed ${products.length} demo products`);
}

async function run() {
  await connectDB();
  if (process.argv.includes("--remove")) await remove();
  else await seed();
}

run()
  .catch((err) => {
    console.error("[demo] Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
