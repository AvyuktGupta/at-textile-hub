import type { ProfilePayload } from "@/providers/auth-provider";
import type { User } from "@/types";

export const BUSINESS_TYPES = [
  "Café / Restaurant",
  "Cloud kitchen",
  "Caterer / Events",
  "Hotel / Hospitality",
  "Distributor / Reseller",
  "Retail store",
  "Corporate / Office",
  "Other",
];

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export interface ProfileForm {
  name: string;
  phone: string;
  companyName: string;
  gstin: string;
  businessType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

/** API error detail keys (dotted model paths) for each form field. */
const API_PATHS: Record<keyof ProfileForm, string> = {
  name: "name",
  phone: "phone",
  companyName: "business.companyName",
  gstin: "business.gstin",
  businessType: "business.businessType",
  line1: "business.shippingAddress.line1",
  line2: "business.shippingAddress.line2",
  city: "business.shippingAddress.city",
  state: "business.shippingAddress.state",
  postalCode: "business.shippingAddress.postalCode",
  country: "business.shippingAddress.country",
};

/** Mirrors isProfileComplete in backend/src/utils/profile.js: what an order needs. */
export function isProfileComplete(user: User) {
  const address = user.business?.shippingAddress ?? {};
  return Boolean(
    user.name && user.phone && user.business?.companyName && address.line1 && address.city && address.state && address.postalCode
  );
}

export function toProfileForm(user?: User | null): ProfileForm {
  const business = user?.business ?? {};
  const address = business.shippingAddress ?? {};
  return {
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    companyName: business.companyName ?? "",
    gstin: business.gstin ?? "",
    businessType: business.businessType ?? "",
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postalCode: address.postalCode ?? "",
    country: address.country || "India",
  };
}

export function toProfilePayload(form: ProfileForm): ProfilePayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    business: {
      companyName: form.companyName.trim(),
      gstin: form.gstin.trim(),
      businessType: form.businessType,
      shippingAddress: {
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || "India",
      },
    },
  };
}

/** Same rules as backend/src/utils/profile.js, for instant feedback. The API remains the authority. */
export function validateProfile(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!form.name.trim()) errors.name = "Your name is required";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) errors.phone = "Please provide a valid phone number";
  if (!form.companyName.trim()) errors.companyName = "Company name is required";
  const gstin = form.gstin.trim().toUpperCase().replace(/\s/g, "");
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    errors.gstin = "GSTIN should be 15 characters, e.g. 27ABCDE1234F1Z5";
  }
  if (!form.line1.trim()) errors.line1 = "Address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  if (!form.postalCode.trim()) errors.postalCode = "PIN code is required";
  else if ((form.country.trim() || "India").toLowerCase() === "india" && !/^[1-9][0-9]{5}$/.test(form.postalCode.trim())) {
    errors.postalCode = "PIN code should be 6 digits";
  }
  return errors;
}

/** Call after setting errors; waits a frame so the aria-invalid attributes have rendered. */
export function focusFirstInvalid() {
  requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
}

export function mapApiProfileErrors(details?: Record<string, string>): ProfileErrors {
  if (!details) return {};
  const errors: ProfileErrors = {};
  for (const [field, path] of Object.entries(API_PATHS) as [keyof ProfileForm, string][]) {
    if (details[path]) errors[field] = details[path];
  }
  return errors;
}
