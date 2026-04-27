import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { PRODUCT_CATEGORY_CATALOG } from "../constants/productCategories";

const PLACEHOLDER_IMAGES = {
  electronics:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  fashion:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  homeLiving:
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
  beauty:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  Electronics: PLACEHOLDER_IMAGES.electronics,
  Fashion: PLACEHOLDER_IMAGES.fashion,
  "Home & Living": PLACEHOLDER_IMAGES.homeLiving,
  Beauty: PLACEHOLDER_IMAGES.beauty,
};

const CATEGORY_BRAND_MAP: Record<string, string> = {
  Electronics: "samsung",
  Fashion: "nike",
  "Home & Living": "ikea",
  Beauty: "loreal",
};

const GENDER_MAP: Record<string, string> = {
  Electronics: "unisex",
  Fashion: "unisex",
  "Home & Living": "unisex",
  Beauty: "women",
};

async function main() {
  const email = "admin@gmail.com";
  const password = "123456";
  const name = "Super Admin";

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdminUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log("Super admin created successfully", superAdminUser.email);
  }

  for (const category of PRODUCT_CATEGORY_CATALOG) {
    for (const subCategory of category.subcategories) {
      const productName = `${subCategory.title} Essentials`;
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: productName,
          category: subCategory.title,
        },
      });

      if (existingProduct) {
        continue;
      }

      await prisma.product.create({
        data: {
          name: productName,
          brand: CATEGORY_BRAND_MAP[category.title] ?? "generic",
          description: `Curated ${subCategory.title.toLowerCase()} collection under ${category.title}.`,
          category: subCategory.title,
          gender: GENDER_MAP[category.title] ?? "unisex",
          sizes: ["M", "L"],
          colors: ["Black", "White"],
          price: 99.99,
          stock: 40,
          images: [CATEGORY_IMAGE_MAP[category.title] ?? PLACEHOLDER_IMAGES.electronics],
          soldCount: 0,
          rating: 4.2,
        },
      });
    }
  }

  console.log("Category sample products seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
