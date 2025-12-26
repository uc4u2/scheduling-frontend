const fs = require("fs");
const path = require("path");

const PACKAGE_JSON = path.join(__dirname, "..", "package.json");
const BUILD_DIR = path.join(__dirname, "..", "build");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
const include = (packageJson.reactSnap && packageJson.reactSnap.include) || [];

if (!fs.existsSync(BUILD_DIR)) {
  console.error("Missing build output. Run `npm run build` in frontend/ first.");
  process.exit(1);
}

const failures = [];

const toBuildPath = (routePath) => {
  if (routePath === "/") {
    return path.join(BUILD_DIR, "index.html");
  }
  const safePath = routePath.replace(/^\//, "");
  return path.join(BUILD_DIR, safePath, "index.html");
};

include.forEach((routePath) => {
  const htmlPath = toBuildPath(routePath);
  if (!fs.existsSync(htmlPath)) {
    failures.push({ routePath, htmlPath });
  }
});

if (failures.length) {
  console.error("Missing pre-rendered HTML for:");
  failures.forEach((item) => {
    console.error(`- ${item.routePath} -> ${item.htmlPath}`);
  });
  process.exit(1);
}

console.log(`react-snap verification passed (${include.length} routes).`);
