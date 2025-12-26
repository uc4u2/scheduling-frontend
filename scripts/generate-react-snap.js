const fs = require("fs");
const path = require("path");
const { routes, disallow } = require("../config/seoRoutes");

const PACKAGE_JSON = path.join(__dirname, "..", "package.json");

const additionalDisallow = [
  "/login",
  "/register",
  "/forgot",
  "/reset",
  "/manager",
  "/client",
  "/recruiter",
  "/admin",
];

const disallowPrefixes = [...(disallow || []), ...additionalDisallow];

const skipExtensions = /\.(pdf|docx?|png|jpe?g|webp|svg)$/i;

const isAllowedRoute = (routePath) =>
  !disallowPrefixes.some((prefix) =>
    routePath === prefix || routePath.startsWith(prefix)
  );

const include = Array.from(
  new Set(
    (routes || [])
      .map((route) => route.path)
      .filter(Boolean)
      .filter((routePath) => routePath.startsWith("/"))
      .filter((routePath) => !skipExtensions.test(routePath))
      .filter(isAllowedRoute)
  )
).sort((a, b) => a.localeCompare(b));

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
packageJson.reactSnap = {
  ...(packageJson.reactSnap || {}),
  crawl: false,
  include,
};

fs.writeFileSync(
  PACKAGE_JSON,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8"
);
