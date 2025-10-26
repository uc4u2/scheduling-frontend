const { createProxyMiddleware } = require("http-proxy-middleware");

const DEFAULT_TARGET = process.env.REACT_APP_API_PROXY_TARGET || "http://localhost:5000";

module.exports = function setupProxy(app) {
  const routesToProxy = [
    "/public",
    "/api",
    "/connect",
  ];

  routesToProxy.forEach((route) => {
    app.use(
      route,
      createProxyMiddleware({
        target: DEFAULT_TARGET,
        changeOrigin: true,
        secure: false,
        logLevel: "warn",
      })
    );
  });
};
