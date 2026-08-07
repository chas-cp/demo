// AI PM Training Program — zero-dependency Node server.
// Serves the static frontend from /public and JSON content from /content.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const CONTENT_DIR = path.join(__dirname, "content");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safeJoin(baseDir, requestPath) {
  const resolved = path.resolve(baseDir, "." + requestPath);
  if (!resolved.startsWith(baseDir)) return null;
  return resolved;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // --- content API ---
  if (pathname === "/api/program") {
    fs.readFile(path.join(CONTENT_DIR, "weeks.json"), (err, data) => {
      if (err) return sendJson(res, 500, { error: "Could not load program content" });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  const weekMatch = pathname.match(/^\/api\/weeks\/([a-z0-9-]+)$/i);
  if (weekMatch) {
    const weekId = weekMatch[1];
    const filePath = safeJoin(path.join(CONTENT_DIR, "weeks"), `/${weekId}.json`);
    if (!filePath) return sendJson(res, 400, { error: "Invalid week id" });
    fs.readFile(filePath, (err, data) => {
      if (err) return sendJson(res, 404, { error: "Week not found" });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // --- static frontend ---
  if (pathname === "/") pathname = "/index.html";
  const staticPath = safeJoin(PUBLIC_DIR, pathname);
  if (!staticPath) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad request");
    return;
  }
  sendFile(res, staticPath);
});

server.listen(PORT, () => {
  console.log(`AI PM Training Program running at http://localhost:${PORT}`);
});
