export type AiProductIndexEntry = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  condition: string;
  discountPercent: number | null;
  effectivePrice: number;
  images: string[];
  soldCount: number;
  rating: number | null;
  isFeatured: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  searchText: string;
};

export type ProductIndexStats = {
  ready: boolean;
  count: number;
  lastSyncedAt: string | null;
};
