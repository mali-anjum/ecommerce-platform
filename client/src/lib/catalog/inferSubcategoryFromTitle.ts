export interface AdminCatalogSubcategory {
  id: string;
  title: string;
  slug: string;
}

export interface AdminCatalogDepartment {
  id: string;
  title: string;
  slug: string;
  subcategories: AdminCatalogSubcategory[];
}

export function inferSubcategoryFromTitle(
  productTitle: string,
  departments: AdminCatalogDepartment[]
): { departmentId: string; subcategoryId: string } | null {
  const normalized = productTitle.trim().toLowerCase();
  if (!normalized) return null;

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return null;

  for (const dept of departments) {
    for (const sub of dept.subcategories) {
      const hay = `${sub.title} ${sub.slug}`.toLowerCase();
      const matched = tokens.some((token) => token.length > 2 && hay.includes(token));
      if (matched) {
        return { departmentId: dept.id, subcategoryId: sub.id };
      }
    }
  }

  return null;
}
