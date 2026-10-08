import mongoose from "mongoose";
import SiteSettings from "../models/SiteSettings.js";
import ApiError from "../utils/ApiError.js";
import pick from "../utils/pick.js";
import { removeUnusedUploads } from "../services/uploadCleanup.js";
import { CACHE_TAGS, revalidateStorefront } from "../services/storefrontRevalidate.js";

const EDITABLE_FIELDS = ["headerImageUrl", "headerTitle", "headerSubtitle", "orderDestinationEmail"];
const MAX_SCROLLS = 12;

export function toPublic(settings) {
  const { orderDestinationEmail: _private, ...rest } = settings.toJSON();
  return {
    ...rest,
    homepageScrolls: rest.homepageScrolls.filter((scroll) => scroll.isActive),
  };
}

function readScrolls(scrolls) {
  if (!Array.isArray(scrolls)) throw ApiError.badRequest("homepageScrolls must be an array");
  if (scrolls.length > MAX_SCROLLS) {
    throw ApiError.badRequest(`You can configure at most ${MAX_SCROLLS} homepage sections`);
  }

  // Array position is the source of truth for ordering, so the admin UI only has to reorder the list.
  return scrolls.map((scroll, index) => ({
    ...(mongoose.isValidObjectId(scroll?._id) && { _id: scroll._id }),
    ...pick(scroll, ["title", "filterTag", "limit", "isActive"]),
    order: index + 1,
  }));
}

export async function getPublicSettings(_req, res) {
  const settings = await SiteSettings.getSingleton();
  res.json({ success: true, data: toPublic(settings) });
}

export async function getAdminSettings(_req, res) {
  const settings = await SiteSettings.getSingleton();
  res.json({ success: true, data: settings });
}

export async function updateSettings(req, res) {
  const settings = await SiteSettings.getSingleton();
  const previousHeaderImage = settings.headerImageUrl;

  settings.set(pick(req.body, EDITABLE_FIELDS));
  if (Object.hasOwn(req.body ?? {}, "homepageScrolls")) {
    settings.homepageScrolls = readScrolls(req.body.homepageScrolls);
  }

  await settings.save();

  if (previousHeaderImage && previousHeaderImage !== settings.headerImageUrl) {
    await removeUnusedUploads([previousHeaderImage]);
  }
  revalidateStorefront([CACHE_TAGS.SETTINGS]);

  res.json({ success: true, data: settings });
}
