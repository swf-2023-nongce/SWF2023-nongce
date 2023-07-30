const { createProxyMiddleware } = require("http-proxy-middleware");

const SERVER_URL = process.env.REACT_APP_SERVER_URL ?? "http://localhost:3030";

module.exports = function (app) {
  // setup cross-origin isolation
  app.use(function (req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  // proxy for /api
  app.use(
    "/api",
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
    })
  );
};
