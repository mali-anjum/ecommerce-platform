export type ProductsActiveFiltersBannerProps = {
  mainCategory?: string;
  subcategory?: string;
  search?: string;
};

/** Shows department / subcategory / search context from URL query params. */
export function ProductsActiveFiltersBanner({
  mainCategory,
  subcategory,
  search,
}: ProductsActiveFiltersBannerProps) {
  if (!mainCategory && !subcategory && !search) return null;

  return (
    <p className="mb-4 text-sm text-muted-foreground">
      {mainCategory && (
        <>
          Department:{" "}
          <span className="font-medium text-foreground">
            {decodeURIComponent(mainCategory)}
          </span>
        </>
      )}
      {subcategory && (
        <>
          {" "}
          • Subcategory:{" "}
          <span className="font-medium text-foreground">
            {decodeURIComponent(subcategory)}
          </span>
        </>
      )}
      {search && (
        <>
          {" "}
          • Search:{" "}
          <span className="font-medium text-foreground">
            {decodeURIComponent(search)}
          </span>
        </>
      )}
    </p>
  );
}
