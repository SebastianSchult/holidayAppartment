export const ASSET_BASE: string =
  (import.meta.env.VITE_ASSET_BASE_URL?.replace(/\/+$/, '') as string) || '';

/** Erzeugt eine absolute Bild-URL relativ zur ASSET_BASE */
export function imgUrl(path: string) {
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${ASSET_BASE}/${p}`;
}