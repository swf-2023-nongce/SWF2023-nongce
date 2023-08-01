const { createProxyMiddleware } = require("http-proxy-middleware");

const MOCK_SERVER_URL = process.env.REACT_APP_MOCK_SERVER_URL ?? "http://127.0.0.1:3030";
const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL ?? "http://127.0.0.1:8080";

console.log("MOCK_SERVER_URL", MOCK_SERVER_URL);
console.log("API_SERVER_URL", API_SERVER_URL);

module.exports = function (app) {
  // setup cross-origin isolation
  app.use(function (req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  // proxy for /api (mock server)
  app.use(
    "/mock-api",
    createProxyMiddleware({
      target: MOCK_SERVER_URL,
      changeOrigin: true,
    })
  );

  // proxy for /auth (api server)
  app.use(
    "/api",
    createProxyMiddleware({
      target: API_SERVER_URL,
      changeOrigin: true,
    })
  );
};
