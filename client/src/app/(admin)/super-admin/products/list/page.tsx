
import ProductManagementScreen from "@/components/super-admin/products/screen/ProductListScreen";

export default function ProductsPage() {
  // const roles = "SELLER", 
  return (
    <ProductManagementScreen
      allowedRole="SUPER_ADMIN"
      title="My Products"
      subtitle="Manage your product catalog"
      addHref="/products/add"
      editHrefBase="/products/edit/"
      emptyStateText="No products found. Start by adding your first product!"
      deniedText="You don't have permission to manage products."
    />
  );
}