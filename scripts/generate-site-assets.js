const fs = require("fs");
const path = require("path");
const { baseUrl, routes, disallow } = require("../config/seoRoutes");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const today = new Date().toISOString().split("T")[0];

const toAbsoluteUrl = (relativePath) => new URL(relativePath, baseUrl).toString();

const sitemapBody = routes
  .map((route) => {
    const loc = toAbsoluteUrl(route.path);
    const lastmod = route.lastmod || today;
    const changefreq = route.changefreq || "monthly";
    const priority = route.priority || "0.5";
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Auto-generated via scripts/generate-site-assets.js -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapBody}\n</urlset>\n`;

const robotsLines = [
  "# Auto-generated via scripts/generate-site-assets.js",
  "User-agent: *",
  "Allow: /",
  ...disallow.map((entry) => `Disallow: ${entry}`),
  "",
  `Sitemap: ${toAbsoluteUrl("/sitemap.xml")}`,
];
const robots = `${robotsLines.join("\n")}\n`;

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(PUBLIC_DIR, "robots.txt"), robots, "utf8");
