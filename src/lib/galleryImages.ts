export const GALLERY_IMAGES = [
  "gallery-01.jpg",
  "gallery-02.jpeg",
  "gallery-03.jpg",
  "gallery-04.jpg",
  "gallery-05.jpeg",
  "gallery-06.jpeg",
  "gallery-07.jpg",
  "gallery-08.jpg",
  "gallery-09.jpg",
  "gallery-10.jpeg",
  "gallery-11.jpeg",
  "gallery-12.jpeg",
  "gallery-13.jpeg",
  "gallery-14.jpg",
  "gallery-15.jpeg",
  "gallery-16.jpeg",
  "gallery-17.jpeg",
  "gallery-18.jpg",
  "gallery-19.jpg",
  "gallery-20.jpg",
  "gallery-21.jpg",
  "gallery-22.jpeg",
  "gallery-23.jpeg",
  "gallery-24.jpg",
  "gallery-25.jpeg",
  "gallery-26.jpg",
  "gallery-27.jpg",
  "gallery-28.jpg",
  "gallery-29.jpeg",
  "gallery-30.jpeg",
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

function getFileExt(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }
  return fileName.slice(dotIndex);
}

export function buildGalleryVariantPath(
  fileName: string,
  width: (typeof GALLERY_VARIANT_WIDTHS)[number],
) {
  const base = getFileBase(fileName);
  const ext = getFileExt(fileName);
  return buildGalleryImagePath(`${base}-${width}${ext}`);
}

export function buildGallerySrcSet(fileName: string) {
  return GALLERY_VARIANT_WIDTHS.map((width) =>
    `${buildGalleryVariantPath(fileName, width)} ${width}w`,
  ).join(", ");
}
