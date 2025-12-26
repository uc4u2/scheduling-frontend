const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const serveStatic = require("serve-static");
const fallback = require("express-history-api-fallback");
const { run } = require("react-snap");

const PACKAGE_JSON = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
const reactSnapConfig = packageJson.reactSnap || {};

const port = reactSnapConfig.port || 45678;
const host = "127.0.0.1";
const sourceDir = path.join(__dirname, "..", reactSnapConfig.source || "build");

const app = express()
  .use(reactSnapConfig.publicPath || "/", serveStatic(sourceDir))
  .use(fallback("200.html", { root: sourceDir }));

const server = http.createServer(app);

server.listen(port, host, async () => {
  try {
    await run({
      ...reactSnapConfig,
      externalServer: true,
    });
    server.close();
  } catch (err) {
    server.close(() => {
      console.error(err);
      process.exit(1);
    });
  }
});
