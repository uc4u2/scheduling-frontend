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

const startServer = (preferredPort) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.once("error", reject);
    server.listen(preferredPort, host, () => resolve(server));
  });

const runSnap = async () => {
  let server;
  try {
    try {
      server = await startServer(port);
    } catch (err) {
      if (err.code !== "EPERM" || port === 0) {
        throw err;
      }
      server = await startServer(0);
    }
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    await run({
      ...reactSnapConfig,
      port: actualPort,
      externalServer: true,
    });
    server.close();
  } catch (err) {
    if (server) {
      server.close(() => {
        console.error(err);
        process.exit(1);
      });
    } else {
      console.error(err);
      process.exit(1);
    }
  }
};

runSnap();
