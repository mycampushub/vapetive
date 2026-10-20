import type { Metadata } from "next";
import { FileQuestion } from "lucide-react";
import { getProductByIdOrSlug } from "@/server/repos/catalog";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductEditorView } from "./product-editor-view";

export const metadata: Metadata = { title: "Edit product" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getProductByIdOrSlug(id);

  if (!item) {
    return (
      <div className="mx-auto max-w-7xl">
        <EmptyState
          icon={FileQuestion}
          title={`No product with id "${id}"`}
          body="The record may have been removed, or the link points at an outdated id. Product ids live in the catalog database."
          actionLabel="Back to products"
          actionHref="/admin/catalog/products"
        />
      </div>
    );
  }

  return <ProductEditorView item={item} />;
}
