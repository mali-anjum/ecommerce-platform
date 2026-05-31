import {
  inferSubcategoryFromTitle,
} from "../inferSubcategoryFromTitle";
import type { AdminCatalogDepartment } from "../inferSubcategoryFromTitle";

const departments: AdminCatalogDepartment[] = [
  {
    id: "dept-men",
    title: "Men",
    slug: "men",
    subcategories: [
      { id: "sub-shirts", title: "Shirts", slug: "shirts" },
      { id: "sub-jackets", title: "Jackets", slug: "jackets" },
    ],
  },
  {
    id: "dept-women",
    title: "Women",
    slug: "women",
    subcategories: [{ id: "sub-dresses", title: "Dresses", slug: "dresses" }],
  },
];

describe("inferSubcategoryFromTitle", () => {
  it("matches using a subcategory title token", () => {
    expect(inferSubcategoryFromTitle("Classic cotton shirts", departments)).toEqual({
      departmentId: "dept-men",
      subcategoryId: "sub-shirts",
    });
  });

  it("matches using a subcategory slug token", () => {
    expect(inferSubcategoryFromTitle("Premium party dresses collection", departments)).toEqual(
      {
        departmentId: "dept-women",
        subcategoryId: "sub-dresses",
      }
    );
  });

  it("ignores short tokens and returns null when no confident match", () => {
    expect(inferSubcategoryFromTitle("xl by v2", departments)).toBeNull();
  });

  it("returns null for empty titles", () => {
    expect(inferSubcategoryFromTitle("   ", departments)).toBeNull();
  });
});
