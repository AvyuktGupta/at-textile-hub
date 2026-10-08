import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 5000,
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  storeName: process.env.STORE_NAME || "CupCraft Wholesale",
  /** Public storefront URL used for links in emails; defaults to the first allowed origin. */
  storefrontUrl: (process.env.STOREFRONT_URL || process.env.CLIENT_ORIGIN?.split(",")[0] || "http://localhost:3000")
    .trim()
    .replace(/\/$/, ""),
  storefrontRevalidate: {
    url: process.env.STOREFRONT_REVALIDATE_URL,
    secret: process.env.REVALIDATE_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM,
  },
};

if (env.isProduction && env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

export default env;
