const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = __dirname;
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(rootDir, "data");
const defaultContentPath = path.join(dataDir, "default-content.json");
const contentPath = path.join(dataDir, "content.json");
const ordersPath = path.join(dataDir, "orders.json");
const publicIndex = path.join(rootDir, "index.html");
const adminPasswordPath = path.join(dataDir, "admin-password.json");
const sessions = new Map();

const ADMIN_COOKIE = "alhelwany_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(contentPath)) {
    fs.copyFileSync(defaultContentPath, contentPath);
  }

  if (!fs.existsSync(ordersPath)) {
    writeJson(ordersPath, []);
  }

  if (!fs.existsSync(adminPasswordPath)) {
    writeJson(adminPasswordPath, {
      password: "admin12345",
    });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce((acc, part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name) {
      return acc;
    }
    acc[name] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[ADMIN_COOKIE];
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { token, session };
}

function createSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function clearSession(req) {
  const existing = getSession(req);
  if (existing) {
    sessions.delete(existing.token);
  }
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
}

function unauthorized(res) {
  sendJson(res, 401, { error: "Unauthorized" });
}

function serveLoginPage(res) {
  sendFile(res, path.join(rootDir, "login.html"));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (_error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function safePathFromUrl(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return path.join(rootDir, normalized);
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/auth/status" && req.method === "GET") {
    sendJson(res, 200, { authenticated: Boolean(getSession(req)) });
    return true;
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const stored = readJson(adminPasswordPath);
      if (!body.password || body.password !== stored.password) {
        sendJson(res, 401, { error: "Invalid password" });
        return true;
      }

      const token = createSession();
      setSessionCookie(res, token);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    clearSession(req);
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/content" && req.method === "GET") {
    sendJson(res, 200, readJson(contentPath));
    return true;
  }

  if (pathname === "/api/content" && req.method === "PUT") {
    if (!getSession(req)) {
      unauthorized(res);
      return true;
    }

    try {
      const body = await parseBody(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendJson(res, 400, { error: "Invalid content payload" });
        return true;
      }

      writeJson(contentPath, body);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  if (pathname === "/api/content/reset" && req.method === "POST") {
    if (!getSession(req)) {
      unauthorized(res);
      return true;
    }

    const defaultContent = readJson(defaultContentPath);
    writeJson(contentPath, defaultContent);
    sendJson(res, 200, defaultContent);
    return true;
  }

  if (pathname === "/api/orders" && req.method === "GET") {
    if (!getSession(req)) {
      unauthorized(res);
      return true;
    }

    sendJson(res, 200, readJson(ordersPath));
    return true;
  }

  if (pathname === "/api/orders" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const requiredFields = [
        "firstName",
        "lastName",
        "thirdName",
        "phone",
        "whatsapp",
        "country",
        "governorate",
        "paymentMethod",
      ];

      const missingField = requiredFields.find((field) => !body[field]);
      if (missingField) {
        sendJson(res, 400, { error: `Missing field: ${missingField}` });
        return true;
      }

      const orders = readJson(ordersPath);
      const order = {
        id: crypto.randomUUID(),
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        thirdName: String(body.thirdName).trim(),
        phone: String(body.phone).trim(),
        whatsapp: String(body.whatsapp).trim(),
        country: String(body.country).trim(),
        governorate: String(body.governorate).trim(),
        paymentMethod: String(body.paymentMethod).trim(),
        notes: String(body.notes || "").trim(),
        createdAt: new Date().toISOString(),
      };

      orders.unshift(order);
      writeJson(ordersPath, orders);
      sendJson(res, 201, { ok: true, order });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  return false;
}

function handleStatic(req, res, pathname) {
  if (pathname === "/login" || pathname === "/login.html") {
    serveLoginPage(res);
    return;
  }

  if (pathname === "/admin" || pathname === "/admin.html") {
    if (!getSession(req)) {
      res.writeHead(302, { Location: "/login.html" });
      res.end();
      return;
    }
  }

  let requestedPath = pathname === "/" ? publicIndex : safePathFromUrl(pathname);

  if (!requestedPath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
    requestedPath = path.join(requestedPath, "index.html");
  }

  if (!fs.existsSync(requestedPath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  sendFile(res, requestedPath);
}

ensureDataFiles();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  try {
    const handled = await handleApi(req, res, pathname);
    if (handled) {
      return;
    }

    handleStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
