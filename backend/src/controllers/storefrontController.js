import Product from "../models/Product.js";
import SiteSettings from "../models/SiteSettings.js";
import { toPublic } from "./settingsController.js";

/** Fields needed to render a product card; keeps rail payloads small. */
export const CARD_FIELDS =
  "title slug sku basePrice discountPercentage finalPrice images tags stockStatus minOrderQty unit isActive createdAt";

/** Everything the homepage needs in one round trip: banner settings plus each section's products. */
export async function getHome(_req, res) {
  const settings = toPublic(await SiteSettings.getSingleton());

  const [sections, tagCounts, totalProducts, offerCount] = await Promise.all([
    Promise.all(
      settings.homepageScrolls.map(async (scroll) => ({
        _id: scroll._id,
        title: scroll.title,
        filterTag: scroll.filterTag,
        products: await Product.find({ isActive: true, tags: scroll.filterTag })
          .select(CARD_FIELDS)
          .sort({ createdAt: -1 })
          .limit(scroll.limit),
      }))
    ),
    Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 16 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, discountPercentage: { $gt: 0 } }),
  ]);

  res.json({
    success: true,
    data: {
      settings,
      sections: sections.filter((section) => section.products.length > 0),
      tags: tagCounts,
      totalProducts,
      offerCount,
    },
  });
}
