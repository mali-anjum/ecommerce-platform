import { redirect } from "next/navigation";

/** SEO generation lives on Add / Edit Product (step 3). */
export default function LegacySeoGeneratorRedirectPage() {
  redirect("/super-admin/products/add");
}
