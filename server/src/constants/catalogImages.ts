/**
 * Curated Unsplash photos (free Unsplash License) for demo catalog data.
 * Values are Unsplash photo ids; use `unsplashUrl` to build a sized URL.
 * Used by the seed (direct URLs) and by `npm run images:refresh` (uploads to Cloudinary).
 */
export function unsplashUrl(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Product name → photo ids (first one is the card/hero image). */
export const PRODUCT_IMAGE_IDS: Record<string, string[]> = {
  // Electronics
  "Nebula X1 Ultra": ["1610945265064-0e34e5519bbf", "1511707171634-5f897ff02aa9"],
  "Aurora Phone 17": ["1592899677977-9c10ca588bbd", "1510557880182-3d4d3cba35a5"],
  "BladeBook Pro 16": ["1496181133206-80ce9b88a853", "1593642632823-8f785ba67e45"],
  "Carbon Air 14": ["1588872657578-7efd1f1555ed", "1484788984921-03950022c9ef"],
  "MacBook Air M2": ["1517336714731-489689fd1ca8", "1611186871348-b1ce696e52c9", "1541807084-5c52b6b3adef"],
  "Horizon Watch Ultra": ["1523275335684-37898b6baf30", "1546868871-7041f2a55e12", "1508685096489-7aacd43bd3b1"],
  "Pulse Ring Gen 3": ["1575311373937-040b8e1fd5b6", "1579586337278-3befd40fd17a"],
  "Studio Pro Headphones": ["1505740420928-5e560c06d30e", "1583394838336-acd977736f90"],
  "Wave Buds Elite": ["1590658268037-6bf12165a8df", "1606220588913-b3aacb4d2f46"],
  // Fashion
  "Titan Bomber Jacket": ["1551028719-00167b16eac5", "1591047139829-d91aecb6caea"],
  "Vertex Performance Tee": ["1521572163474-6864f9cf17ab", "1583743814966-8936f5b7be1a"],
  "Nova Knit Dress": ["1595777457583-95e059d581b8", "1539008835657-9e8e9680c956"],
  "Helix Wool Coat": ["1539533018447-63fcce2678e3", "1548624313-0396c75e4b1a"],
  "Rocket Sneakers Youth": ["1606107557195-0e29a4b5b4aa", "1595950653106-6c9ebd614d3a"],
  "Explorer Hoodie": ["1620799140408-edc6dcb6d633", "1519238263530-99bdd11df2ea"],
  "Nike sportsman": ["1542291026-7eec264c27ff", "1600185365483-26d7a4cc7519"],
  "Nike Sportswear Tech Fleece": ["1556821840-3a63f95609a7", "1578587018452-892bacefd3f2"],
  "Orbit Leather Belt": ["1624222247344-550fb60583dc", "1664286074176-5206ee5dc878"],
  "Prism Mini Backpack": ["1553062407-98eeb64c6a62", "1622560480605-d83c853bc5c3"],
  // Home & Living
  "Atlas Oak Desk": ["1518455027359-f3f8164ba6bd", "1593062096033-9a26b09da705"],
  "Nimbus Lounge Chair": ["1567538096630-e0c55bd6374c", "1586023492125-27b2c045efd7"],
  "Aura Wall Print Set": ["1513519245088-0e12902e5a38", "1582562124811-c09040d0a901"],
  "Zen Ceramic Vases (3-pack)": ["1581783342308-f792dbdd27c5", "1612196808214-b8e1d6145a8c"],
  "Pulse Induction Cooktop": ["1556909114-f6e7ad7d3136", "1556911220-bff31c812dba"],
  "Nova Chef Knife Set": ["1593618998160-e34014e67546", "1556909190-eccf4a8bf97a"],
  "Halo Floor Lamp": ["1507473885765-e6ed057f782c", "1517991104123-1d56a6e81ed9", "1513506003901-1e6a229e2d15"],
  "Starfield LED Strip Kit": ["1550745165-9bc0b252726f", "1540932239986-30128078f3c5"],
  // Beauty
  "Lumina Repair Serum": ["1620916566398-39f1143ab7be", "1608571423902-eed4a5ad8108"],
  "Cloud Cream Moisturizer": ["1556228578-8c89e6adf883", "1601049541289-9b1b7bbbfe19"],
  "Spectrum Eyeshadow Palette": ["1512496015851-a90fb38ba796", "1596462502278-27bfdc403348"],
  "Velvet Matte Lip Bundle": ["1586495777744-4413f21062fa", "1631214540553-ff044a3ff1d4"],
  "Midnight Oud EDP": ["1541643600914-78b084683601", "1592945403244-b3fbafd7f539"],
  "Citrus Drift EDT": ["1523293182086-7651a899d37f", "1588405748880-12d1d2a59f75"],
  "Silk Repair Shampoo": ["1535585209827-a15fcdbc4c2d", "1608248597279-f99d160bfcbc"],
  "Ion Smoothing Iron": ["1522337360788-8b13dee7a37e", "1580618672591-eb180b1a973f", "1562322140-8baeececf3df"],
};

/** Subcategory title → photo ids, for products without a curated entry above. */
export const SUBCATEGORY_IMAGE_IDS: Record<string, string[]> = {
  Smartphones: PRODUCT_IMAGE_IDS["Aurora Phone 17"]!,
  Laptops: PRODUCT_IMAGE_IDS["BladeBook Pro 16"]!,
  Wearables: PRODUCT_IMAGE_IDS["Horizon Watch Ultra"]!,
  Audio: PRODUCT_IMAGE_IDS["Studio Pro Headphones"]!,
  Men: PRODUCT_IMAGE_IDS["Titan Bomber Jacket"]!,
  Women: PRODUCT_IMAGE_IDS["Nova Knit Dress"]!,
  Kids: PRODUCT_IMAGE_IDS["Explorer Hoodie"]!,
  Accessories: PRODUCT_IMAGE_IDS["Prism Mini Backpack"]!,
  Furniture: PRODUCT_IMAGE_IDS["Nimbus Lounge Chair"]!,
  Decor: PRODUCT_IMAGE_IDS["Zen Ceramic Vases (3-pack)"]!,
  Kitchen: PRODUCT_IMAGE_IDS["Pulse Induction Cooktop"]!,
  Lighting: PRODUCT_IMAGE_IDS["Halo Floor Lamp"]!,
  Skincare: PRODUCT_IMAGE_IDS["Lumina Repair Serum"]!,
  Makeup: PRODUCT_IMAGE_IDS["Spectrum Eyeshadow Palette"]!,
  Fragrance: PRODUCT_IMAGE_IDS["Midnight Oud EDP"]!,
  Haircare: PRODUCT_IMAGE_IDS["Silk Repair Shampoo"]!,
  Electronics: PRODUCT_IMAGE_IDS["MacBook Air M2"]!,
};

export const BANNER_IMAGE_IDS: string[] = [
  "1441986300917-64674bd600d8",
  "1483985988355-763728e1935b",
  "1607082348824-0a96f2a4b9da",
  "1472851294608-062f824d29cc",
];

/** Curated ids for a product, falling back to its subcategory; null when neither is known. */
export function imageIdsForProduct(name: string, category: string): string[] | null {
  return PRODUCT_IMAGE_IDS[name.trim()] ?? SUBCATEGORY_IMAGE_IDS[category.trim()] ?? null;
}
