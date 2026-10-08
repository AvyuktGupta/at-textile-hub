import mongoose from "mongoose";
import { normalizeTag } from "./Product.js";

const SINGLETON_KEY = "site";

const homepageScrollSchema = new mongoose.Schema({
  title: { type: String, required: [true, "Scroll title is required"], trim: true, maxlength: 80 },
  filterTag: {
    type: String,
    required: [true, "A filter tag is required"],
    set: normalizeTag,
  },
  order: { type: Number, default: 0 },
  limit: { type: Number, default: 12, min: 1, max: 48 },
  isActive: { type: Boolean, default: true },
});

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: SINGLETON_KEY, unique: true, immutable: true },
    headerImageUrl: { type: String, trim: true, default: "" },
    headerTitle: { type: String, trim: true, maxlength: 120, default: "Wholesale cups, made to order" },
    headerSubtitle: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "Paper, PET and ripple-wall cups for cafés, caterers and distributors.",
    },
    orderDestinationEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^$|^\S+@\S+\.\S+$/, "Please provide a valid order email address"],
    },
    homepageScrolls: {
      type: [homepageScrollSchema],
      default: () => [
        { title: "Most Popular", filterTag: "popular", order: 1 },
        { title: "Latest Designs", filterTag: "new", order: 2 },
      ],
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

siteSettingsSchema.pre("save", function sortScrolls() {
  this.homepageScrolls.sort((a, b) => a.order - b.order);
});

/** Returns the single settings document, creating it with defaults on first access. */
siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  const existing = await this.findOne({ key: SINGLETON_KEY });
  if (existing) return existing;
  try {
    return await this.create({ key: SINGLETON_KEY });
  } catch (err) {
    // Another request created it concurrently.
    if (err.code === 11000) return this.findOne({ key: SINGLETON_KEY });
    throw err;
  }
};

export default mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);
