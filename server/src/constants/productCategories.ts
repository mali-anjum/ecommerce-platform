export interface ProductSubcategory {
  title: string;
  slug: string;
}

export interface ProductCategory {
  title: string;
  slug: string;
  subcategories: ProductSubcategory[];
}

export const PRODUCT_CATEGORY_CATALOG: ProductCategory[] = [
  {
    title: "Electronics",
    slug: "electronics",
    subcategories: [
      { title: "Smartphones", slug: "smartphones" },
      { title: "Laptops", slug: "laptops" },
      { title: "Wearables", slug: "wearables" },
      { title: "Audio", slug: "audio" },
    ],
  },
  {
    title: "Fashion",
    slug: "fashion",
    subcategories: [
      { title: "Men", slug: "men" },
      { title: "Women", slug: "women" },
      { title: "Kids", slug: "kids" },
      { title: "Accessories", slug: "accessories" },
    ],
  },
  {
    title: "Home & Living",
    slug: "home-living",
    subcategories: [
      { title: "Furniture", slug: "furniture" },
      { title: "Decor", slug: "decor" },
      { title: "Kitchen", slug: "kitchen" },
      { title: "Lighting", slug: "lighting" },
    ],
  },
  {
    title: "Beauty",
    slug: "beauty",
    subcategories: [
      { title: "Skincare", slug: "skincare" },
      { title: "Makeup", slug: "makeup" },
      { title: "Fragrance", slug: "fragrance" },
      { title: "Haircare", slug: "haircare" },
    ],
  },
];

export const FLAT_CATEGORY_TITLES = PRODUCT_CATEGORY_CATALOG.flatMap((category) => [
  category.title,
  ...category.subcategories.map((subcategory) => subcategory.title),
]);
