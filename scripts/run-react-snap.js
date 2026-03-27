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
const noisyLogPatterns = [
  "Failed to load Stripe.js",
  "Failed to load resource: net::ERR_FAILED",
  "chrome-error://chromewebdata",
  "in browser redirect (chrome-error://chromewebdata)",
];

const installLogFilter = () => {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const shouldDrop = (chunk) => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk || "");
    return noisyLogPatterns.some((pattern) => text.includes(pattern));
  };
  process.stdout.write = (chunk, encoding, cb) => {
    if (shouldDrop(chunk)) {
      if (typeof cb === "function") cb();
      return true;
    }
    return originalStdoutWrite(chunk, encoding, cb);
  };
  process.stderr.write = (chunk, encoding, cb) => {
    if (shouldDrop(chunk)) {
      if (typeof cb === "function") cb();
      return true;
    }
    return originalStderrWrite(chunk, encoding, cb);
  };
};

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
  installLogFilter();
  let server;
  const isIgnorableSnapError = (err) => {
    const text = String(err && (err.stack || err.message || err));
    return (
      text.includes("Execution context was destroyed") ||
      text.includes("Failed to load Stripe.js") ||
      text.includes("net::ERR_FAILED")
    );
  };
  const exitWith = (code, err) => {
    if (!server) {
      if (code !== 0 && err) console.error(err);
      process.exit(code);
      return;
    }
    server.close(() => {
      if (code !== 0 && err) console.error(err);
      process.exit(code);
    });
  };
  let handledFatal = false;
  const handleGlobalFailure = (err) => {
    if (handledFatal) return;
    handledFatal = true;
    if (isIgnorableSnapError(err)) {
      console.warn("react-snap warning ignored:", String((err && err.message) || err));
      exitWith(0);
      return;
    }
    exitWith(1, err);
  };
  process.on("unhandledRejection", handleGlobalFailure);
  process.on("uncaughtException", handleGlobalFailure);
  try {
    if (String(process.env.SKIP_REACT_SNAP || "").trim() === "1") {
      console.warn("react-snap skipped via SKIP_REACT_SNAP=1");
      process.exit(0);
      return;
    }
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
    if (server) server.close();
    process.removeListener("unhandledRejection", handleGlobalFailure);
    process.removeListener("uncaughtException", handleGlobalFailure);
  } catch (err) {
    if (isIgnorableSnapError(err)) {
      process.removeListener("unhandledRejection", handleGlobalFailure);
      process.removeListener("uncaughtException", handleGlobalFailure);
      console.warn("react-snap warning ignored:", String(err.message || err));
      exitWith(0);
      return;
    }
    process.removeListener("unhandledRejection", handleGlobalFailure);
    process.removeListener("uncaughtException", handleGlobalFailure);
    exitWith(1, err);
  }
};

runSnap();
