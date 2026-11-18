import { prisma } from "../../lib/prisma";
import { PRODUCT_CATEGORY_CATALOG } from "../../constants/productCategories";
import { getCatalogTreeWithCounts } from "../catalogService";

/** Category tree for filters — DB-backed counts when departments exist, else legacy constants + groupBy. */
export async function getProductCategoriesPayload() {
  const deptRows = await prisma.department.count();
  if (deptRows > 0) {
    return getCatalogTreeWithCounts();
  }

  const productCountByCategory = await prisma.product.groupBy({
    by: ["category"],
    _count: {
      _all: true,
    },
  });

  const categoryCountLookup = new Map<string, number>();
  const subCategoryCountLookup = new Map<string, number>();

  for (const row of productCountByCategory) {
    const categoryKey = row.category.toLowerCase();
    const categoryCatalog = PRODUCT_CATEGORY_CATALOG.find(
      (category) => category.title.toLowerCase() === categoryKey
    );
    const count = row._count._all;

    if (categoryCatalog) {
      categoryCountLookup.set(
        categoryKey,
        (categoryCountLookup.get(categoryKey) ?? 0) + count
      );
    } else {
      for (const category of PRODUCT_CATEGORY_CATALOG) {
        const matchedSubCategory = category.subcategories.find(
          (subCategory) => subCategory.title.toLowerCase() === categoryKey
        );

        if (matchedSubCategory) {
          categoryCountLookup.set(
            category.title.toLowerCase(),
            (categoryCountLookup.get(category.title.toLowerCase()) ?? 0) + count
          );
          subCategoryCountLookup.set(
            `${category.title.toLowerCase()}::${matchedSubCategory.title.toLowerCase()}`,
            (subCategoryCountLookup.get(
              `${category.title.toLowerCase()}::${matchedSubCategory.title.toLowerCase()}`
            ) ?? 0) + count
          );
        }
      }
    }
  }

  return PRODUCT_CATEGORY_CATALOG.map((category) => {
    const categoryTotal =
      categoryCountLookup.get(category.title.toLowerCase()) ?? 0;

    return {
      ...category,
      productCount: categoryTotal,
      subcategories: category.subcategories.map((subCategory) => ({
        ...subCategory,
        productCount:
          subCategoryCountLookup.get(
            `${category.title.toLowerCase()}::${subCategory.title.toLowerCase()}`
          ) ?? 0,
      })),
    };
  });
}
