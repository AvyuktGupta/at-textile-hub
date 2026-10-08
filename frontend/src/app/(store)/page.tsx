import { HomeHero } from "@/components/store/home-hero";
import { HowOrderingWorks } from "@/components/store/how-ordering-works";
import { ProductRail } from "@/components/store/product-rail";
import { RecentlyViewedRail } from "@/components/store/recently-viewed-rail";
import { StoreUnavailable } from "@/components/store/store-unavailable";
import { TagStrip } from "@/components/store/tag-strip";
import { tagHref } from "@/lib/catalog";
import { getHomeData } from "@/lib/storefront";

export default async function HomePage() {
  const data = await getHomeData();
  if (!data) return <StoreUnavailable />;

  const { settings, sections, tags, totalProducts, offerCount } = data;

  return (
    <>
      <HomeHero
        imageUrl={settings.headerImageUrl}
        title={settings.headerTitle}
        subtitle={settings.headerSubtitle}
        productCount={totalProducts}
        offerCount={offerCount}
      />
      <TagStrip tags={tags} />
      <RecentlyViewedRail />
      {sections.map((section, index) => (
        <ProductRail
          key={section._id}
          title={section.title}
          href={tagHref(section.filterTag)}
          products={section.products}
          priority={index === 0}
        />
      ))}
      <HowOrderingWorks />
    </>
  );
}
