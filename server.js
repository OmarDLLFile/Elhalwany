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
const MAX_STRING_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const ALLOWED_PAYMENT_METHODS = new Set(["Cash on Delivery", "Visa", "Credit Card"]);

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

function setSecurityHeaders(req, res) {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals = { cspNonce: nonce };
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://fonts.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "));
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

function isMutationMethod(method) {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function getRequestOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : (forwardedProto || "http").split(",")[0].trim() || "http";
  return `${protocol}://${req.headers.host}`;
}

function hasTrustedOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    return origin === getRequestOrigin(req);
  }

  const secFetchSite = req.headers["sec-fetch-site"];
  return !secFetchSite || secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function sanitizeText(value, maxLength = MAX_STRING_LENGTH) {
  return escapeHtml(String(value || "").trim()).slice(0, maxLength);
}

function isAllowedUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
    return true;
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "tel:"].includes(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function sanitizeContentPayload(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeContentPayload(item));
  }

  if (!value || typeof value !== "object") {
    return typeof value === "string" ? sanitizeText(value, MAX_NOTES_LENGTH) : value;
  }

  const sanitized = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      if (/(image|logo|url|href|src)$/i.test(key)) {
        if (!isAllowedUrl(entry)) {
          throw new Error(`Invalid URL for ${key}`);
        }
        sanitized[key] = entry.trim();
        continue;
      }

      sanitized[key] = sanitizeText(entry, MAX_NOTES_LENGTH);
      continue;
    }

    sanitized[key] = sanitizeContentPayload(entry);
  }

  return sanitized;
}

function sanitizeOrderPayload(body) {
  const order = {
    firstName: sanitizeText(body.firstName),
    lastName: sanitizeText(body.lastName),
    thirdName: sanitizeText(body.thirdName),
    phone: sanitizeText(body.phone, 50),
    whatsapp: sanitizeText(body.whatsapp, 50),
    country: sanitizeText(body.country, 80),
    governorate: sanitizeText(body.governorate, 80),
    paymentMethod: sanitizeText(body.paymentMethod, 40),
    notes: sanitizeText(body.notes || "", MAX_NOTES_LENGTH),
  };

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

  const missingField = requiredFields.find((field) => !order[field]);
  if (missingField) {
    throw new Error(`Missing field: ${missingField}`);
  }

  if (!ALLOWED_PAYMENT_METHODS.has(order.paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  return order;
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
  if (isMutationMethod(req.method) && !hasTrustedOrigin(req)) {
    sendJson(res, 403, { error: "Blocked by CSRF protection" });
    return true;
  }

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

      writeJson(contentPath, sanitizeContentPayload(body));
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
      const orders = readJson(ordersPath);
      const sanitizedOrder = sanitizeOrderPayload(body);
      const order = {
        id: crypto.randomUUID(),
        ...sanitizedOrder,
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
  setSecurityHeaders(req, res);
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
