import { Suspense } from "react";
import type { Metadata } from "next";
import { EditProduct, EditProductSkeleton } from "./edit-product";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}
