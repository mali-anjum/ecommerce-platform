export interface Product {
  id: string;                 // UUID or DB id (e.g. "6364f..."). Keep as string for flexibility.
  name: string;               // Human-facing product title
  brand: string;              // Brand slug or name
  condition?: "NEW" | "REFURBISHED" | "USED";
  sellerId?: string | null;
  sellerName?: string | null;
  discountPercent?: number | null;
  dealStartsAt?: string | null;
  dealEndsAt?: string | null;
  category: string;           // Category slug (e.g. "shirts")
  subcategoryId?: string | null; // Normalized subcategory relation (optional during transition)
  description?: string;       // Optional longer description (may be absent)
  gender?: "male" | "female" | "unisex" | "other"; // if relevant to business logic
  sizes: string[];            // Allowed size identifiers, e.g. ["S","M","L"]
  colors: string[];           // Color hex strings or color names
  price: number;              // Stored in smallest currency unit (cents) OR decimal — pick one
  currency?: string;          // "USD", "PKR", etc. (useful if multi-currency)
  stock: number;              // Available inventory count (>= 0)
  rating?: number | null;     // Average rating, or null if none
  soldCount?: number;         // How many sold
  images: string[];           // Array of image URLs (0..n)
  createdAt?: string;         // ISO timestamp from server (e.g. "2025-11-16T12:34:56Z")
  updatedAt?: string;         // ISO timestamp
}


export interface ProductFilters {
  page?: number;
  limit?: number;
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  conditions?: string[];
  sellerIds?: string[];
  onDeal?: boolean;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  /** Full-text style match on name, description, brand */
  search?: string;
  /** Aggregates Electronics + all electronics subs when set (e.g. Electronics) */
  mainCategory?: string;
  /** Single leaf category title (e.g. Smartphones) */
  subcategory?: string;
  /** all | new | trending | bestsellers | featured */
  collection?: string;
}

export interface SellerFilterOption {
  id: string;
  name: string;
}

export interface ProductResponse {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}