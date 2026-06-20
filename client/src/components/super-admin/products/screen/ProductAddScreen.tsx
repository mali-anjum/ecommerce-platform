"use client";

import { ProductFormContainer } from "../organisms/ProductFormContainer";

interface ProductAddScreenProps {
  listPath?: string;
}

export function ProductAddScreen({ 
  listPath = "/super-admin/products/list" 
}: ProductAddScreenProps) {
  return <ProductFormContainer listPath={listPath} />;
}

export default ProductAddScreen;