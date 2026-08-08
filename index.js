// AI PM Training Program — zero-dependency Node server.
// Serves the static frontend from /public, JSON content from /content, and
// tracks team progress (no login — a per-browser learner id) in /data/progress.json.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const CONTENT_DIR = path.join(__dirname, "content");
const DATA_DIR = path.join(__dirname, "data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const WEEK_STATUSES = new Set(["not-started", "in-progress", "complete"]);
const MAX_BODY_BYTES = 64 * 1024;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PROGRESS_FILE)) fs.writeFileSync(PROGRESS_FILE, "{}");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Serializes writes so two near-simultaneous saves can't clobber each other.
let writeQueue = Promise.resolve();
function updateProgress(mutator) {
  writeQueue = writeQueue.then(async () => {
    let progress = {};
    try {
      progress = JSON.parse(await fs.promises.readFile(PROGRESS_FILE, "utf8"));
    } catch {
      progress = {};
    }
    mutator(progress);
    await fs.promises.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    return progress;
  });
  return writeQueue;
}

function weekContentExists(weekId) {
  const filePath = safeJoin(path.join(CONTENT_DIR, "weeks"), `/${weekId}.json`);
  return filePath && fs.existsSync(filePath);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // --- content API ---
  if (req.method === "GET" && pathname === "/api/program") {
    fs.readFile(path.join(CONTENT_DIR, "weeks.json"), (err, data) => {
      if (err) return sendJson(res, 500, { error: "Could not load program content" });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  const weekMatch = pathname.match(/^\/api\/weeks\/([a-z0-9-]+)$/i);
  if (req.method === "GET" && weekMatch) {
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

  // --- team progress API ---
  if (req.method === "GET" && pathname === "/api/team") {
    fs.readFile(PROGRESS_FILE, "utf8", (err, data) => {
      if (err) return sendJson(res, 500, { error: "Could not load team progress" });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/progress") {
    readBody(req)
      .then((raw) => {
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          return sendJson(res, 400, { error: "Invalid JSON body" });
        }
        const { learnerId, name, weekId, status } = body || {};
        if (typeof learnerId !== "string" || !/^[a-zA-Z0-9-]{8,64}$/.test(learnerId)) {
          return sendJson(res, 400, { error: "Invalid learnerId" });
        }
        if (typeof name !== "string" || name.trim().length === 0 || name.length > 80) {
          return sendJson(res, 400, { error: "Invalid name" });
        }
        if (typeof weekId !== "string" || !weekContentExists(weekId)) {
          return sendJson(res, 400, { error: "Unknown weekId" });
        }
        if (!WEEK_STATUSES.has(status)) {
          return sendJson(res, 400, { error: "Invalid status" });
        }

        updateProgress((progress) => {
          const entry = progress[learnerId] || { name: name.trim(), weeks: {} };
          entry.name = name.trim();
          entry.weeks[weekId] = status;
          entry.updatedAt = new Date().toISOString();
          progress[learnerId] = entry;
        })
          .then(() => sendJson(res, 200, { ok: true }))
          .catch(() => sendJson(res, 500, { error: "Could not save progress" }));
      })
      .catch(() => sendJson(res, 413, { error: "Body too large or unreadable" }));
    return;
  }

  // --- static frontend ---
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return;
  }
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
