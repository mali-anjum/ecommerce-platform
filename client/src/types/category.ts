export interface ProductSubcategory {
  title: string;
  slug: string;
  productCount?: number;
}

export interface ProductCategory {
  title: string;
  slug: string;
  productCount?: number;
  subcategories: ProductSubcategory[];
}
