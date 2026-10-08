import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const RECENTLY_VIEWED_LIMIT = 20;
const SALT_ROUNDS = 12;

export const ROLES = Object.freeze({ ADMIN: "admin", USER: "user" });

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 100, default: "India" },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, maxlength: 160 },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 20 },
    businessType: { type: String, trim: true, maxlength: 80 },
    shippingAddress: { type: addressSchema, default: () => ({}) },
  },
  { _id: false }
);

const recentlyViewedSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9\s-]{7,20}$/, "Please provide a valid phone number"],
    },
    business: { type: businessSchema, default: () => ({}) },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    recentlyViewed: { type: [recentlyViewedSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isAdmin = function isAdmin() {
  return this.role === ROLES.ADMIN;
};

/**
 * Moves the product to the front of the user's list, de-duplicated and capped.
 * Done as one pipeline update so concurrent views of the same product can't leave duplicates.
 */
userSchema.statics.recordView = async function recordView(userId, productId) {
  const product = new mongoose.Types.ObjectId(String(productId));
  await this.collection.updateOne({ _id: new mongoose.Types.ObjectId(String(userId)) }, [
    {
      $set: {
        recentlyViewed: {
          $slice: [
            {
              $concatArrays: [
                [{ product, viewedAt: "$$NOW" }],
                {
                  $filter: {
                    input: { $ifNull: ["$recentlyViewed", []] },
                    cond: { $ne: ["$$this.product", product] },
                  },
                },
              ],
            },
            RECENTLY_VIEWED_LIMIT,
          ],
        },
      },
    },
  ]);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
