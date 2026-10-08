import ApiError from "./ApiError.js";

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Normalises and validates the buyer-editable profile fields. Every buyer needs a phone number,
 * company name and full shipping address before they can place an order, so they're required here.
 * Returns a plain object safe to assign to a User; throws a 400 with per-field details otherwise.
 */
export function parseBuyerProfile(body = {}) {
  const business = body.business ?? {};
  const address = business.shippingAddress ?? {};

  const profile = {
    name: text(body.name, 120),
    phone: text(body.phone, 20),
    business: {
      companyName: text(business.companyName, 160),
      gstin: text(business.gstin, 20).toUpperCase().replace(/\s/g, ""),
      businessType: text(business.businessType, 80),
      shippingAddress: {
        line1: text(address.line1, 200),
        line2: text(address.line2, 200),
        city: text(address.city, 100),
        state: text(address.state, 100),
        postalCode: text(address.postalCode, 20),
        country: text(address.country, 100) || "India",
      },
    },
  };

  const errors = {};
  const requireField = (path, value, label) => {
    if (!value) errors[path] = `${label} is required`;
  };

  requireField("name", profile.name, "Your name");
  requireField("phone", profile.phone, "Phone number");
  if (profile.phone && !PHONE_PATTERN.test(profile.phone)) errors.phone = "Please provide a valid phone number";
  requireField("business.companyName", profile.business.companyName, "Company name");
  if (profile.business.gstin && !GSTIN_PATTERN.test(profile.business.gstin)) {
    errors["business.gstin"] = "GSTIN should be 15 characters, e.g. 27ABCDE1234F1Z5";
  }

  const addr = profile.business.shippingAddress;
  requireField("business.shippingAddress.line1", addr.line1, "Address");
  requireField("business.shippingAddress.city", addr.city, "City");
  requireField("business.shippingAddress.state", addr.state, "State");
  requireField("business.shippingAddress.postalCode", addr.postalCode, "PIN code");
  if (addr.postalCode && addr.country.toLowerCase() === "india" && !/^[1-9][0-9]{5}$/.test(addr.postalCode)) {
    errors["business.shippingAddress.postalCode"] = "PIN code should be 6 digits";
  }

  if (Object.keys(errors).length) throw ApiError.badRequest("Please check the highlighted fields", errors);
  return profile;
}

/** True when the account has everything an order email needs. Admins created by the seed may not. */
export function isProfileComplete(user) {
  const addr = user.business?.shippingAddress ?? {};
  return Boolean(
    user.name && user.phone && user.business?.companyName && addr.line1 && addr.city && addr.state && addr.postalCode
  );
}

export function validatePassword(password, field = "password") {
  if (typeof password !== "string" || password.length < 8) {
    throw ApiError.badRequest("Please check the highlighted fields", {
      [field]: "Password must be at least 8 characters",
    });
  }
  if (password.length > 128) {
    throw ApiError.badRequest("Please check the highlighted fields", { [field]: "Password is too long" });
  }
}
