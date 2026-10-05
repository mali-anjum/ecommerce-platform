import ProductManagementScreen from "@/components/super-admin/products/screen/ProductListScreen";

export default function SellerProductsListPage() {
  return (
    <ProductManagementScreen
      allowedRole="SELLER"
      title="Your Products"
      subtitle="Seller view is scoped to your own products only."
      addHref="/seller/products/add"
      editHrefBase="/seller/products/add?id="
      emptyStateText="No products yet. Add your first listing."
      deniedText="Seller access required."
    />
  );
}
