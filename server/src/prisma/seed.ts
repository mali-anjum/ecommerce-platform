import "../config/loadEnv";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { PRODUCT_CATEGORY_CATALOG } from "../constants/productCategories";
import {
  upsertCatalogFromConstants,
  linkOrphanProductsToSubcategories,
} from "../services/catalogService";

const BANNER_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfe3b1a2b88?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1920&q=80",
];

const IMAGE_BY_FAMILY: Record<string, string> = {
  Electronics:
    "https://images.unsplash.com/photo-1498049794561-8590a66e234a?auto=format&fit=crop&w=1200&q=80",
  Fashion:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  "Home & Living":
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
  Beauty:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
};

/** Two products per subcategory: realistic titles, brands, sizes where it matters */
function seedsForSubcategory(
  parentTitle: string,
  subTitle: string
): Array<{
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  soldCount: number;
  rating: number;
}> {
  const imgHint = parentTitle;
  const fashionSizes = ["XS", "S", "M", "L", "XL"];
  const shoeSizes = ["7", "8", "9", "10", "11"];
  const noSizes: string[] = [];

  const row = (
    name: string,
    brand: string,
    price: number,
    sizes: string[],
    colors: string[],
    sold: number,
    extra?: string
  ) => ({
    name,
    brand,
    description:
      extra ??
      `Premium ${subTitle.toLowerCase()} pick from our ${parentTitle} collection. Ships fast, backed by our warranty where applicable.`,
    price,
    stock: 40 + Math.floor(Math.random() * 40),
    sizes,
    colors,
    soldCount: sold,
    rating: 4 + Math.random(),
  });

  const key = `${parentTitle}::${subTitle}`;
  type SeedRow = ReturnType<typeof row>;
  const presets: Record<string, SeedRow[]> = {
    "Electronics::Smartphones": [
      row(
        "Nebula X1 Ultra",
        "samsung",
        1099,
        noSizes,
        ["Phantom Black", "Silver"],
        420
      ),
      row(
        "Aurora Phone 17",
        "apple",
        999,
        noSizes,
        ["Natural Titanium", "Blue"],
        890
      ),
    ],
    "Electronics::Laptops": [
      row(
        "BladeBook Pro 16",
        "sony",
        2199,
        noSizes,
        ["Graphite", "Silver"],
        210
      ),
      row(
        "Carbon Air 14",
        "dell",
        1299,
        noSizes,
        ["Black", "Ice"],
        340
      ),
    ],
    "Electronics::Wearables": [
      row(
        "Pulse Ring Gen 3",
        "garmin",
        349,
        ["S", "M", "L"],
        ["Black", "Rose Gold"],
        560
      ),
      row(
        "Horizon Watch Ultra",
        "apple",
        799,
        noSizes,
        ["Midnight", "Starlight"],
        1200
      ),
    ],
    "Electronics::Audio": [
      row(
        "Studio Pro Headphones",
        "sony",
        399,
        noSizes,
        ["Black", "Silver"],
        670
      ),
      row(
        "Wave Buds Elite",
        "bose",
        229,
        noSizes,
        ["Black", "White"],
        1540
      ),
    ],
    "Fashion::Men": [
      row(
        "Titan Bomber Jacket",
        "nike",
        189,
        fashionSizes,
        ["Black", "Navy"],
        210
      ),
      row(
        "Vertex Performance Tee",
        "adidas",
        49,
        fashionSizes,
        ["White", "Green"],
        890
      ),
    ],
    "Fashion::Women": [
      row(
        "Nova Knit Dress",
        "zara",
        79,
        fashionSizes,
        ["Black", "Sage"],
        430
      ),
      row(
        "Helix Wool Coat",
        "uniqlo",
        149,
        fashionSizes,
        ["Camel", "Black"],
        310
      ),
    ],
    "Fashion::Kids": [
      row(
        "Rocket Sneakers Youth",
        "puma",
        59,
        shoeSizes,
        ["Black", "Pink"],
        520
      ),
      row(
        "Explorer Hoodie",
        "nike",
        44,
        fashionSizes.slice(0, 4),
        ["Blue", "Grey"],
        410
      ),
    ],
    "Fashion::Accessories": [
      row(
        "Orbit Leather Belt",
        "gucci",
        89,
        ["28", "32", "36"],
        ["Brown", "Black"],
        220
      ),
      row(
        "Prism Mini Backpack",
        "north face",
        129,
        noSizes,
        ["Black", "Olive"],
        180
      ),
    ],
    "Home & Living::Furniture": [
      row(
        "Nimbus Lounge Chair",
        "ikea",
        449,
        noSizes,
        ["Charcoal", "Sand"],
        95
      ),
      row(
        "Atlas Oak Desk",
        "west elm",
        699,
        noSizes,
        ["Walnut", "Oak"],
        72
      ),
    ],
    "Home & Living::Decor": [
      row(
        "Aura Wall Print Set",
        "ikea",
        89,
        noSizes,
        ["Multi", "Mono"],
        280
      ),
      row(
        "Zen Ceramic Vases (3-pack)",
        "crate and barrel",
        59,
        noSizes,
        ["White", "Terracotta"],
        410
      ),
    ],
    "Home & Living::Kitchen": [
      row(
        "Nova Chef Knife Set",
        "zwilling",
        159,
        noSizes,
        ["Steel"],
        330
      ),
      row(
        "Pulse Induction Cooktop",
        "bosch",
        329,
        noSizes,
        ["Black"],
        140
      ),
    ],
    "Home & Living::Lighting": [
      row(
        "Halo Floor Lamp",
        "philips",
        189,
        noSizes,
        ["Black", "Brass"],
        260
      ),
      row(
        "Starfield LED Strip Kit",
        "philips",
        79,
        noSizes,
        ["RGB"],
        610
      ),
    ],
    "Beauty::Skincare": [
      row(
        "Lumina Repair Serum",
        "loreal",
        42,
        noSizes,
        ["50ml"],
        890
      ),
      row(
        "Cloud Cream Moisturizer",
        "cerave",
        24,
        noSizes,
        ["236ml"],
        1200
      ),
    ],
    "Beauty::Makeup": [
      row(
        "Velvet Matte Lip Bundle",
        "maybelline",
        34,
        noSizes,
        ["Rose", "Crimson"],
        540
      ),
      row(
        "Spectrum Eyeshadow Palette",
        "urban decay",
        52,
        noSizes,
        ["Sunset"],
        410
      ),
    ],
    "Beauty::Fragrance": [
      row(
        "Midnight Oud EDP",
        "chanel",
        120,
        noSizes,
        ["50ml", "100ml"],
        320
      ),
      row(
        "Citrus Drift EDT",
        "dior",
        95,
        noSizes,
        ["75ml"],
        280
      ),
    ],
    "Beauty::Haircare": [
      row(
        "Silk Repair Shampoo",
        "pantene",
        18,
        noSizes,
        ["400ml"],
        760
      ),
      row(
        "Ion Smoothing Iron",
        "ghd",
        189,
        noSizes,
        ["Black", "White"],
        190
      ),
    ],
  };

  return (
    presets[key] ?? [
      row(
        `${subTitle} Signature`,
        "generic",
        99.99,
        parentTitle === "Fashion" ? fashionSizes : noSizes,
        ["Black", "White"],
        100,
        `Explore our ${subTitle.toLowerCase()} lineup in ${imgHint}.`
      ),
      row(
        `${subTitle} Plus`,
        "generic",
        129.99,
        parentTitle === "Fashion" ? fashionSizes : noSizes,
        ["Grey", "Blue"],
        80,
        `Versatile ${subTitle.toLowerCase()} essentials for everyday use.`,
      ),
    ]
  );
}

async function ensureSuperAdmin() {
  const email = "admin@gmail.com";
  const password = "123456";
  const name = "Super Admin";

  const existing = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });
  if (existing) return;

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Super admin created:", email);
}

async function ensureDemoSeller() {
  const email = "seller@demo.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const hashedPassword = await bcrypt.hash("123456", 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo Seller",
      password: hashedPassword,
      role: "SELLER",
    },
  });
  await prisma.seller.create({
    data: {
      name: "Demo Store",
      slug: "demo-store",
      userId: user.id,
      isActive: true,
    },
  });
  console.log("Demo seller created:", email, "(password: 123456)");
}

async function seedBannersIfEmpty() {
  const n = await prisma.featureBanner.count();
  if (n > 0) return;
  await prisma.featureBanner.createMany({
    data: BANNER_IMAGE_URLS.map((imageUrl) => ({ imageUrl })),
  });
  console.log(`Seeded ${BANNER_IMAGE_URLS.length} feature banners`);
}

async function seedCatalogProducts() {
  for (const cat of PRODUCT_CATEGORY_CATALOG) {
    const hero = IMAGE_BY_FAMILY[cat.title] ?? IMAGE_BY_FAMILY.Electronics;
    for (const sub of cat.subcategories) {
      const rows = seedsForSubcategory(cat.title, sub.title);
      for (const row of rows) {
        const existing = await prisma.product.findFirst({
          where: {
            name: row.name,
            category: sub.title,
          },
        });
        if (existing) continue;

        await prisma.product.create({
          data: {
            name: row.name,
            brand: row.brand,
            description: row.description,
            category: sub.title,
            gender:
              cat.title === "Fashion"
                ? sub.title === "Men"
                  ? "men"
                  : sub.title === "Women"
                    ? "women"
                    : sub.title === "Kids"
                      ? "kids"
                      : "unisex"
                : "unisex",
            sizes: row.sizes,
            colors: row.colors,
            price: row.price,
            stock: row.stock,
            soldCount: row.soldCount,
            rating: Math.round(row.rating * 10) / 10,
            images: [hero],
            isFeatured: false,
          },
        });
      }
    }
  }
  console.log("Catalog products upserted (new rows only)");
}

async function pinFeaturedProducts() {
  await prisma.product.updateMany({ data: { isFeatured: false } });

  const top = await prisma.product.findMany({
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: { id: true },
  });
  if (top.length === 0) return;

  await prisma.product.updateMany({
    where: { id: { in: top.map((t) => t.id) } },
    data: { isFeatured: true },
  });
  console.log(`Marked ${top.length} products as featured`);
}

async function seedKnowledgeDefaults() {
  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        {
          question: "How do I track my order?",
          answer:
            "Use the Track Order page and enter your order ID to see delivery status and updates.",
          href: "/track-order",
          sortOrder: 0,
        },
        {
          question: "How can I request a refund?",
          answer:
            "Open your account orders, select the item, and submit a return or refund request from the order details.",
          href: "/orders",
          sortOrder: 1,
        },
        {
          question: "How do I change my address?",
          answer:
            "Go to Addresses in your account menu to add or update shipping addresses.",
          href: "/addresses",
          sortOrder: 2,
        },
        {
          question: "What is your return policy?",
          answer:
            "Most items can be returned within 30 days of delivery in original condition. Refunds are issued to the original payment method after inspection.",
          sortOrder: 3,
        },
        {
          question: "Do you ship internationally?",
          answer:
            "We ship to select countries. Duties and taxes may apply at delivery depending on your region.",
          sortOrder: 4,
        },
      ],
    });
    console.log("Default FAQ items seeded");
  }

  await prisma.storePolicySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      returnPolicy:
        "Returns are accepted within 30 days of delivery for unused items in original packaging. Refunds are processed within 5–10 business days after we receive and inspect the return.",
      shippingPolicy:
        "Standard domestic shipping takes 3–7 business days. Express shipping (1–2 business days) is available at checkout where offered.",
      shipsInternationally: true,
      internationalShippingDetails:
        "International orders ship to select regions. Delivery typically takes 7–14 business days. Import duties and taxes may be charged by your local carrier.",
      supportEmail: "support@example.com",
    },
    update: {},
  });
  console.log("Store policy settings ensured");
}

async function seedDemoProductReviews() {
  const existing = await prisma.productReview.count();
  if (existing > 0) {
    console.log("Product reviews already seeded, skipping");
    return;
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 3,
    select: { id: true, name: true },
  });
  if (products.length === 0) return;

  const samples = [
    { rating: 2, body: "Battery bad, does not last a full day" },
    { rating: 2, body: "Packaging damaged when it arrived" },
    { rating: 2, body: "Delivery slow, took two weeks" },
    { rating: 3, body: "Battery life could be better but screen is nice" },
    { rating: 5, body: "Great quality and fast shipping" },
    { rating: 1, body: "Box was crushed and item scratched" },
    { rating: 2, body: "Late delivery again" },
    { rating: 4, body: "Good value for the price" },
  ];

  const createdAt = new Date();
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!;
    const product = products[index % products.length]!;
    createdAt.setDate(createdAt.getDate() - index);
    await prisma.productReview.create({
      data: {
        productId: product.id,
        rating: sample.rating,
        body: sample.body,
        status: "APPROVED",
        createdAt: new Date(createdAt),
      },
    });
  }

  console.log(`Seeded ${samples.length} demo product reviews for AI analyzer`);
}

async function main() {
  await ensureSuperAdmin();
  await ensureDemoSeller();
  await seedBannersIfEmpty();
  await seedKnowledgeDefaults();
  await seedCatalogProducts();
  await pinFeaturedProducts();

  const catalogUpsert = await upsertCatalogFromConstants();
  console.log("Catalog upsert:", catalogUpsert);
  const linked = await linkOrphanProductsToSubcategories();
  console.log("Products linked to Subcategory rows:", linked);
  await seedDemoProductReviews();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
