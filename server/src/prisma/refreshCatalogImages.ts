/**
 * Replaces every product and feature-banner image with curated Unsplash photos uploaded
 * to Cloudinary, then deletes this project's previous Cloudinary product images.
 *
 *   npm run images:refresh            # dry run: prints the plan, changes nothing
 *   npm run images:refresh -- --apply # uploads, updates the DB, deletes old assets
 *
 * Only assets in PROJECT_FOLDERS are deleted; other projects sharing the Cloudinary
 * account (and the knowledge-base folder) are never touched.
 */
import "../config/loadEnv";
import cloudinary from "../config/cloudinary";
import prisma from "../lib/prisma";
import {
  BANNER_IMAGE_IDS,
  imageIdsForProduct,
  unsplashUrl,
} from "../constants/catalogImages";

const PRODUCT_FOLDER = "ecommerce-prisma/products";
const BANNER_FOLDER = "ecommerce-prisma/ecommerce-feature-banners";
const PROJECT_FOLDERS = [PRODUCT_FOLDER, BANNER_FOLDER, "ecommerce-products"];
const DELETE_BATCH_SIZE = 100;

const apply = process.argv.includes("--apply");

interface CloudinaryResource {
  public_id: string;
  asset_folder?: string;
}

function folderOf(resource: CloudinaryResource): string {
  if (resource.asset_folder) return resource.asset_folder;
  const parts = resource.public_id.split("/");
  return parts.slice(0, -1).join("/");
}

async function listProjectImagePublicIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      resource_type: "image",
      max_results: 500,
      next_cursor: cursor,
    });
    for (const resource of page.resources as CloudinaryResource[]) {
      if (PROJECT_FOLDERS.includes(folderOf(resource))) ids.push(resource.public_id);
    }
    cursor = page.next_cursor;
  } while (cursor);
  return ids;
}

async function uploadFromUnsplash(photoId: string, folder: string, width: number): Promise<string> {
  const result = await cloudinary.uploader.upload(unsplashUrl(photoId, width), {
    folder,
    public_id: `unsplash-${photoId}`,
    overwrite: true,
  });
  return result.secure_url;
}

/** Uploads each distinct photo once and reuses the URL for products sharing it. */
function createUploader(folder: string, width: number) {
  const cache = new Map<string, Promise<string>>();
  return (photoId: string): Promise<string> => {
    let pending = cache.get(photoId);
    if (!pending) {
      pending = uploadFromUnsplash(photoId, folder, width);
      cache.set(photoId, pending);
    }
    return pending;
  };
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  const unmapped = products.filter((p) => !imageIdsForProduct(p.name, p.category));
  if (unmapped.length > 0) {
    const names = unmapped.map((p) => `"${p.name}" (${p.category})`).join(", ");
    throw new Error(`No curated images for: ${names}. Add them to constants/catalogImages.ts.`);
  }

  const oldPublicIds = await listProjectImagePublicIds();

  // Same-name products (e.g. duplicate listings) get a rotated photo order so cards differ.
  const seenNames = new Map<string, number>();
  const plan = products.map((product) => {
    const ids = imageIdsForProduct(product.name, product.category)!;
    const offset = seenNames.get(product.name) ?? 0;
    seenNames.set(product.name, offset + 1);
    const rotated = ids.map((_, i) => ids[(i + offset) % ids.length]!);
    return { product, photoIds: rotated };
  });

  console.log(`Products to update: ${plan.length}`);
  for (const { product, photoIds } of plan) {
    console.log(`  ${product.category.trim()} / ${product.name}: ${photoIds.length} photos`);
  }
  console.log(`Banners to replace with: ${BANNER_IMAGE_IDS.length} photos`);
  console.log(`Old Cloudinary images to delete (${PROJECT_FOLDERS.join(", ")}): ${oldPublicIds.length}`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to make these changes.");
    return;
  }

  // 1. Upload first so the DB never points at missing images.
  const uploadProductPhoto = createUploader(PRODUCT_FOLDER, 1200);
  const uploadBannerPhoto = createUploader(BANNER_FOLDER, 1920);
  const productUpdates = await Promise.all(
    plan.map(async ({ product, photoIds }) => ({
      id: product.id,
      images: await Promise.all(photoIds.map(uploadProductPhoto)),
    }))
  );
  const bannerUrls = await Promise.all(BANNER_IMAGE_IDS.map(uploadBannerPhoto));
  console.log("Uploaded new images to Cloudinary");

  // 2. Point the DB at the new images in one transaction.
  await prisma.$transaction([
    ...productUpdates.map(({ id, images }) =>
      prisma.product.update({ where: { id }, data: { images } })
    ),
    prisma.featureBanner.deleteMany({}),
    prisma.featureBanner.createMany({ data: bannerUrls.map((imageUrl) => ({ imageUrl })) }),
  ]);
  console.log(`Updated ${productUpdates.length} products and ${bannerUrls.length} banners`);

  // 3. Delete the previous assets (new uploads use `unsplash-*` ids and are kept).
  const newPublicIds = new Set(
    [...productUpdates.flatMap((u) => u.images), ...bannerUrls].map((url) =>
      decodeURIComponent(url.replace(/^.*\/upload\/v\d+\//, "").replace(/\.[a-z0-9]+$/i, ""))
    )
  );
  const toDelete = oldPublicIds.filter((id) => !newPublicIds.has(id));
  for (let i = 0; i < toDelete.length; i += DELETE_BATCH_SIZE) {
    await cloudinary.api.delete_resources(toDelete.slice(i, i + DELETE_BATCH_SIZE), {
      resource_type: "image",
    });
  }
  console.log(`Deleted ${toDelete.length} old Cloudinary images`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
