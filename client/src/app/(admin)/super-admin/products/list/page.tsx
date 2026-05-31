import ProductManagementList from "@/components/products/organisms/ProductManagementList";

export default function SuperAdminProductListingPage() {
  return (
    <ProductManagementList
      allowedRole="SUPER_ADMIN"
      title="Product Inventory"
      subtitle="Super admin can view and manage all products."
      addHref="/super-admin/products/add"
      editHrefBase="/super-admin/products/add?id="
      emptyStateText="No products found."
      deniedText="Super admin access required."
    />
  );
}