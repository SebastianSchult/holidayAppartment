import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const publicDir = resolve(cwd, "public");
const siteUrl = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:5173"
)
  .trim()
  .replace(/\/+$/, "");

const publicRoutes = [
  "/",
  "/gallery",
  "/prices",
  "/book",
  "/impressum",
  "/datenschutz",
];

const today = new Date().toISOString().slice(0, 10);

function urlFor(pathname) {
  return `${siteUrl}${pathname === "/" ? "/" : pathname}`;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  publicRoutes
    .map(
      (pathname) =>
        `  <url>\n` +
        `    <loc>${urlFor(pathname)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `  </url>`,
    )
    .join("\n") +
  `\n</urlset>\n`;

const robots = `User-agent: *\n` +
  `Allow: /\n\n` +
  `Disallow: /admin\n` +
  `Disallow: /admin/login\n` +
  `Disallow: /login\n\n` +
  `Sitemap: ${siteUrl}/sitemap.xml\n`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(resolve(publicDir, "robots.txt"), robots, "utf8");

