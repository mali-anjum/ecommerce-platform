
import ProductManagementScreen from "@/components/super-admin/products/screen/ProductListScreen";

export default function ProductsPage() {
  return (
    <ProductManagementScreen
      allowedRole="SUPER_ADMIN"
      title="My Products"
      subtitle="Manage your product catalog"
      addHref="/super-admin/products/add"
      editHrefBase="/super-admin/products/add?id="
      emptyStateText="No products found. Start by adding your first product!"
      deniedText="You don't have permission to manage products."
    />
  );
}