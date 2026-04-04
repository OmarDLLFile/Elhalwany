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
const PHONE_DISPLAY_REGEX = /^[0-9+\s()/-]{7,20}$/;
const WHATSAPP_WA_REGEX = /^[0-9]{8,20}$/;

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

function getPublicOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : (forwardedProto || "http").split(",")[0].trim() || "http";
  return `${protocol}://${req.headers.host}`;
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function resolvePublicUrl(origin, value, fallbackPath = "/") {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return new URL(fallbackPath, origin).toString();
  }

  if (normalized.startsWith("data:image/")) {
    return normalized;
  }

  try {
    return new URL(normalized, origin).toString();
  } catch (_error) {
    return new URL(fallbackPath, origin).toString();
  }
}

function buildSeoSchema(origin) {
  const content = readJson(contentPath);
  const siteUrl = `${origin}/`;
  const imageUrl = resolvePublicUrl(origin, content.brand.logo, "/assets/images/logo.jpg");
  const faqItems = [
    {
      question: "ما أنواع المخللات المتوفرة لدى مخللات الحلواني؟",
      answer: "نوفر زيتون مخلل، خيار مخلل، لفت، جزر، بصل مخلل ومخلل مشكل مع اهتمام بالجودة والطعم المصري الأصيل.",
    },
    {
      question: "هل يمكن الطلب عبر واتساب؟",
      answer: "نعم، يمكن التواصل مباشرة عبر واتساب أو استخدام نموذج الطلب داخل الموقع لإرسال البيانات والمنتجات المطلوبة.",
    },
    {
      question: "ما مناطق التوصيل المتاحة؟",
      answer: "نخدم الجيزة وكفر طهرمس وبولاق الدكرور والمناطق المحيطة مع إمكانية تأكيد التوصيل حسب المنطقة.",
    },
    {
      question: "هل المنتجات مناسبة للمنازل والمطاعم؟",
      answer: "نعم، المنتجات مناسبة للاستخدام المنزلي والمطاعم والطلبات المتكررة مع جودة ثابتة.",
    },
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: content.brand.name,
      alternateName: ["Al Helwany Pickles", "Elhalwany Pickels"],
      inLanguage: ["ar-EG", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: content.brand.name,
      alternateName: ["Al Helwany Pickles", "Elhalwany Pickels"],
      url: siteUrl,
      logo: imageUrl,
      sameAs: [`https://wa.me/${content.contact.whatsappWaNumber}`],
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${siteUrl}#business`,
      name: content.brand.name,
      alternateName: "Al Helwany Pickles, Elhalwany Pickels",
      description: `${content.brand.name} يقدم زيتون مخلل وخيار مخلل ولفت وجزر وبصل ومشكل بخبرة تتجاوز 25 سنة.`,
      url: siteUrl,
      image: imageUrl,
      logo: imageUrl,
      telephone: content.contact.phoneDisplay,
      areaServed: ["الجيزة", "القاهرة الكبرى"],
      address: {
        "@type": "PostalAddress",
        streetAddress: content.contact.addressLines.join("، "),
        addressRegion: "الجيزة",
        addressCountry: "EG",
      },
      sameAs: [
        `https://wa.me/${content.contact.whatsappWaNumber}`,
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "منتجات مخللات الحلواني",
      itemListElement: content.products.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.name,
          description: item.description,
          image: resolvePublicUrl(origin, item.image, "/assets/images/logo.jpg"),
          brand: {
            "@type": "Brand",
            name: content.brand.name,
          },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

function sendHtmlFile(req, res, filePath) {
  const origin = getPublicOrigin(req);
  const content = readJson(contentPath);
  const rawHtml = fs.readFileSync(filePath, "utf8");
  const siteUrl = `${origin}/`;
  const ogImage = resolvePublicUrl(origin, content.hero.image, "/assets/images/logo.jpg");
  const html = rawHtml
    .replaceAll("__SITE_URL__", siteUrl)
    .replaceAll("__SITE_ORIGIN__", origin)
    .replaceAll("__OG_IMAGE__", ogImage)
    .replace("__SCHEMA_JSON__", escapeJsonForHtml(buildSeoSchema(origin)));

  sendHtml(res, 200, html);
}

function sendRobots(req, res) {
  const origin = getPublicOrigin(req);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
  res.end(body);
}

function sendSitemap(req, res) {
  const origin = getPublicOrigin(req);
  const lastmod = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  res.writeHead(200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
  res.end(xml);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRequiredText(value, fieldName, min = 1, max = MAX_STRING_LENGTH) {
  assert(typeof value === "string", `${fieldName} must be a string`);
  const trimmed = value.trim();
  assert(trimmed.length >= min, `${fieldName} is required`);
  assert(trimmed.length <= max, `${fieldName} is too long`);
}

function validateOptionalText(value, fieldName, max = MAX_STRING_LENGTH) {
  assert(typeof value === "string", `${fieldName} must be a string`);
  assert(value.trim().length <= max, `${fieldName} is too long`);
}

function validateArray(value, fieldName, min = 0) {
  assert(Array.isArray(value), `${fieldName} must be an array`);
  assert(value.length >= min, `${fieldName} must contain at least ${min} item(s)`);
}

function validatePhoneDisplay(value, fieldName) {
  validateRequiredText(value, fieldName, 7, 20);
  assert(PHONE_DISPLAY_REGEX.test(value), `${fieldName} format is invalid`);
}

function validateWhatsappNumber(value, fieldName) {
  validateRequiredText(value, fieldName, 8, 20);
  assert(WHATSAPP_WA_REGEX.test(value), `${fieldName} format is invalid`);
}

function isAllowedUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
    return true;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    /^[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|svg|gif|ico)$/i.test(trimmed)
  ) {
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

function validateContentPayload(content) {
  assert(content && typeof content === "object" && !Array.isArray(content), "Invalid content payload");

  validateRequiredText(content.brand?.name, "Brand name", 2, 120);
  validateRequiredText(content.brand?.tagline, "Brand tagline", 2, 120);
  validateRequiredText(content.brand?.footerSummary, "Brand footer summary", 10, 300);
  assert(isAllowedUrl(content.brand?.logo), "Brand logo is invalid");

  validateRequiredText(content.hero?.eyebrow, "Hero eyebrow", 2, 120);
  validateRequiredText(content.hero?.title, "Hero title", 2, 120);
  validateRequiredText(content.hero?.tagline, "Hero tagline", 2, 120);
  validateRequiredText(content.hero?.text, "Hero text", 10, 600);
  validateRequiredText(content.hero?.primaryCta, "Hero primary CTA", 2, 80);
  validateRequiredText(content.hero?.secondaryCta, "Hero secondary CTA", 2, 80);
  assert(isAllowedUrl(content.hero?.image), "Hero image is invalid");
  validateArray(content.hero?.trust, "Hero trust items", 1);
  content.hero.trust.forEach((item, index) => validateRequiredText(item, `Hero trust item ${index + 1}`, 2, 140));
  validateArray(content.hero?.metrics, "Hero metrics", 1);
  content.hero.metrics.forEach((item, index) => {
    validateRequiredText(item?.value, `Hero metric value ${index + 1}`, 1, 40);
    validateRequiredText(item?.label, `Hero metric label ${index + 1}`, 2, 80);
  });

  validateRequiredText(content.about?.label, "About label", 2, 80);
  validateRequiredText(content.about?.title, "About title", 2, 180);
  validateRequiredText(content.about?.text1, "About text 1", 10, 800);
  validateRequiredText(content.about?.text2, "About text 2", 10, 800);
  validateRequiredText(content.about?.experienceValue, "About experience value", 1, 20);
  validateRequiredText(content.about?.experienceTitle, "About experience title", 2, 80);
  validateRequiredText(content.about?.experienceText, "About experience text", 5, 220);
  assert(isAllowedUrl(content.about?.image), "About image is invalid");

  validateRequiredText(content.products?.label, "Products label", 2, 80);
  validateRequiredText(content.products?.title, "Products title", 2, 180);
  validateRequiredText(content.products?.subtitle, "Products subtitle", 10, 260);
  validateRequiredText(content.products?.detailsLabel, "Products details label", 2, 80);
  validateRequiredText(content.products?.orderLabel, "Products order label", 2, 80);
  validateArray(content.products?.items, "Products items", 1);
  content.products.items.forEach((item, index) => {
    validateRequiredText(item?.name, `Product name ${index + 1}`, 2, 120);
    validateRequiredText(item?.description, `Product description ${index + 1}`, 5, 280);
    validateRequiredText(item?.modalDescription, `Product modal description ${index + 1}`, 5, 500);
    assert(isAllowedUrl(item?.image), `Product image ${index + 1} is invalid`);
  });

  validateRequiredText(content.whyUs?.label, "Why us label", 2, 80);
  validateRequiredText(content.whyUs?.title, "Why us title", 2, 180);
  validateArray(content.whyUs?.features, "Why us features", 1);
  content.whyUs.features.forEach((item, index) => {
    validateRequiredText(item?.title, `Why us feature title ${index + 1}`, 2, 120);
    validateRequiredText(item?.text, `Why us feature text ${index + 1}`, 5, 300);
  });
  validateArray(content.whyUs?.trust, "Why us trust items", 1);
  content.whyUs.trust.forEach((item, index) => {
    validateRequiredText(item?.title, `Why us trust title ${index + 1}`, 2, 120);
    validateRequiredText(item?.text, `Why us trust text ${index + 1}`, 5, 300);
  });

  validateRequiredText(content.gallery?.label, "Gallery label", 2, 80);
  validateRequiredText(content.gallery?.title, "Gallery title", 2, 180);
  validateArray(content.gallery?.items, "Gallery items", 1);
  content.gallery.items.forEach((item, index) => {
    validateRequiredText(item?.alt, `Gallery alt ${index + 1}`, 2, 160);
    assert(isAllowedUrl(item?.image), `Gallery image ${index + 1} is invalid`);
  });

  validateRequiredText(content.testimonials?.label, "Testimonials label", 2, 80);
  validateRequiredText(content.testimonials?.title, "Testimonials title", 2, 180);
  validateRequiredText(content.testimonials?.subtitle, "Testimonials subtitle", 5, 260);
  validateArray(content.testimonials?.items, "Testimonials items", 1);
  content.testimonials.items.forEach((item, index) => {
    validateRequiredText(item?.title, `Testimonial title ${index + 1}`, 2, 120);
    validateRequiredText(item?.text, `Testimonial text ${index + 1}`, 5, 300);
  });

  validateRequiredText(content.contact?.label, "Contact label", 2, 80);
  validateRequiredText(content.contact?.title, "Contact title", 2, 180);
  validateRequiredText(content.contact?.text, "Contact text", 10, 400);
  validatePhoneDisplay(content.contact?.whatsappDisplay, "Displayed WhatsApp number");
  validatePhoneDisplay(content.contact?.phoneDisplay, "Displayed phone number");
  validateWhatsappNumber(content.contact?.whatsappWaNumber, "WhatsApp wa.me number");
  validateRequiredText(content.contact?.whatsappLabel, "Contact WhatsApp label", 2, 80);
  validateRequiredText(content.contact?.footerWhatsappLabel, "Footer WhatsApp label", 2, 80);
  validateRequiredText(content.contact?.mapLabel, "Map label", 2, 80);
  validateRequiredText(content.contact?.footerMapLabel, "Footer map label", 2, 80);
  assert(isAllowedUrl(content.contact?.mapUrl), "Contact map URL is invalid");
  validateArray(content.contact?.addressLines, "Contact address lines", 1);
  content.contact.addressLines.forEach((line, index) => validateRequiredText(line, `Address line ${index + 1}`, 2, 160));
}

function sanitizeOrderPayload(body) {
  const items = Array.isArray(body.items)
    ? body.items
        .map((item) => ({
          productIndex: Number(item.productIndex),
          name: sanitizeText(item.name, 120),
          quantity: Math.max(1, Number(item.quantity) || 1),
          image: isAllowedUrl(item.image) ? item.image.trim() : "",
        }))
        .filter((item) => Number.isInteger(item.productIndex) && item.productIndex >= 0 && item.name)
    : [];

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
    items,
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

  assert(PHONE_DISPLAY_REGEX.test(order.phone), "Phone format is invalid");
  assert(PHONE_DISPLAY_REGEX.test(order.whatsapp), "WhatsApp format is invalid");
  validateRequiredText(order.country, "Country", 2, 80);
  validateRequiredText(order.governorate, "Governorate", 2, 80);
  validateOptionalText(order.notes, "Notes", MAX_NOTES_LENGTH);

  if (order.items.length === 0) {
    throw new Error("Cart is empty");
  }

  order.items.forEach((item, index) => {
    validateRequiredText(item.name, `Order item name ${index + 1}`, 2, 120);
    assert(Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999, `Order item quantity ${index + 1} is invalid`);
  });

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
      validateRequiredText(body.password, "Password", 8, 128);
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

      const sanitizedContent = sanitizeContentPayload(body);
      validateContentPayload(sanitizedContent);
      writeJson(contentPath, sanitizedContent);
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
  if (pathname === "/robots.txt") {
    sendRobots(req, res);
    return;
  }

  if (pathname === "/sitemap.xml") {
    sendSitemap(req, res);
    return;
  }

  if (pathname === "/login" || pathname === "/login.html") {
    sendHtmlFile(req, res, path.join(rootDir, "login.html"));
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

  if (path.extname(requestedPath).toLowerCase() === ".html") {
    sendHtmlFile(req, res, requestedPath);
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
