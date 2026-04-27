export const categoryItems = [
  {
    title: "Electronics",
    icon: "Smartphone",
    subcategories: [
      { title: "Smartphones", to: "/category/electronics/smartphones", popular: true },
      { title: "Laptops", to: "/category/electronics/laptops", popular: true },
      { title: "Wearables", to: "/category/electronics/wearables" },
      { title: "Audio", to: "/category/electronics/audio", sale: true },
    ],
    featured: [
      { title: "Apple", to: "/brand/apple", image: "/apple.jpg" },
      { title: "Samsung", to: "/brand/samsung", image: "/samsung.jpg" },
    ]
  },
  {
    title: "Fashion",
    icon: "Shirt",
    subcategories: [
      { title: "Men", to: "/category/fashion/men", new: true },
      { title: "Women", to: "/category/fashion/women" },
      { title: "Kids", to: "/category/fashion/kids" },
      { title: "Accessories", to: "/category/fashion/accessories" },
    ]
  },
  {
    title: "Home & Living",
    icon: "Home",
    subcategories: [
      { title: "Furniture", to: "/category/home-living/furniture" },
      { title: "Decor", to: "/category/home-living/decor" },
      { title: "Kitchen", to: "/category/home-living/kitchen" },
      { title: "Lighting", to: "/category/home-living/lighting" },
    ],
  },
  {
    title: "Beauty",
    icon: "Sparkles",
    subcategories: [
      { title: "Skincare", to: "/category/beauty/skincare" },
      { title: "Makeup", to: "/category/beauty/makeup" },
      { title: "Fragrance", to: "/category/beauty/fragrance" },
      { title: "Haircare", to: "/category/beauty/haircare" },
    ],
  },
];