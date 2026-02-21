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

export function buildGalleryImagePath(fileName: string) {
  return `/img/${encodeURIComponent(fileName)}`;
}
