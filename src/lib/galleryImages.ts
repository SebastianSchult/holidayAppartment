export const GALLERY_IMAGES = [
  "WhatsApp Image 2025-09-22 at 13.51.50 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.50.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.51 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.51.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.52 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.52 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.52 (3).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.52 (4).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.52.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.53 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.53 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.53 (3).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.53.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.54 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.54 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.54 (3).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.54.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.55 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.55 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.55.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.56 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.56 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.56 (3).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.56 (4).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.56.jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.57 (1).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.57 (2).jpeg",
  "WhatsApp Image 2025-09-22 at 13.51.57.jpeg",
];

const GALLERY_VARIANT_WIDTHS = [640, 1600] as const;

export function buildGalleryImagePath(fileName: string) {
  return `/img/${encodeURIComponent(fileName)}`;
}

function getFileBase(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return fileName;
  }
  return fileName.slice(0, dotIndex);
}

export function buildGalleryVariantPath(
  fileName: string,
  width: (typeof GALLERY_VARIANT_WIDTHS)[number],
  format: "avif" | "webp",
) {
  const base = getFileBase(fileName);
  return buildGalleryImagePath(`${base}-${width}.${format}`);
}

export function buildGallerySrcSet(
  fileName: string,
  format: "avif" | "webp",
) {
  return GALLERY_VARIANT_WIDTHS.map((width) =>
    `${buildGalleryVariantPath(fileName, width, format)} ${width}w`,
  ).join(", ");
}
