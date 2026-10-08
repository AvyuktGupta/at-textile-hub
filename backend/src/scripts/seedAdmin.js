import { connectDB, disconnectDB } from "../config/db.js";
import User, { ROLES } from "../models/User.js";
import SiteSettings from "../models/SiteSettings.js";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE } = process.env;

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding");
  }

  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.role = ROLES.ADMIN;
    await existing.save();
    console.log(`[seed] Promoted existing user ${existing.email} to admin`);
  } else {
    const admin = await User.create({
      name: ADMIN_NAME || "Store Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone: ADMIN_PHONE || "+910000000000",
      role: ROLES.ADMIN,
    });
    console.log(`[seed] Created admin ${admin.email}`);
  }

  const settings = await SiteSettings.getSingleton();
  if (!settings.orderDestinationEmail) {
    settings.orderDestinationEmail = ADMIN_EMAIL;
    await settings.save();
  }
  console.log("[seed] Site settings ready");
}

run()
  .catch((err) => {
    console.error("[seed] Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
