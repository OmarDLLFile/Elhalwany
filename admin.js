const manager = window.SiteContentManager;
let currentContent = null;
const ordersNotificationToggle = document.getElementById("orders-notification-toggle");
const ordersNotificationPanel = document.getElementById("orders-notification-panel");
const ordersNotificationCount = document.getElementById("orders-notification-count");

const arrayConfigs = {
  heroTrust: {
    containerId: "hero-trust-editor",
    title: "عنصر ثقة",
    create: () => "",
    fields: [{ key: "value", label: "النص", type: "text", full: true }],
  },
  heroMetrics: {
    containerId: "hero-metrics-editor",
    title: "إحصائية",
    create: () => ({ value: "", label: "" }),
    fields: [
      { key: "value", label: "القيمة", type: "text" },
      { key: "label", label: "الوصف", type: "text" },
    ],
  },
  productsItems: {
    containerId: "products-items-editor",
    title: "منتج",
    create: () => ({ name: "", description: "", modalDescription: "", image: "" }),
    fields: [
      { key: "name", label: "الاسم", type: "text" },
      { key: "image", label: "الصورة", type: "image", full: true },
      { key: "description", label: "الوصف المختصر", type: "textarea", full: true },
      { key: "modalDescription", label: "وصف نافذة التفاصيل", type: "textarea", full: true },
    ],
  },
  whyFeatures: {
    containerId: "why-features-editor",
    title: "ميزة",
    create: () => ({ title: "", text: "" }),
    fields: [
      { key: "title", label: "العنوان", type: "text" },
      { key: "text", label: "الوصف", type: "textarea", full: true },
    ],
  },
  whyTrust: {
    containerId: "why-trust-editor",
    title: "عنصر ثقة",
    create: () => ({ title: "", text: "" }),
    fields: [
      { key: "title", label: "العنوان", type: "text" },
      { key: "text", label: "الوصف", type: "textarea", full: true },
    ],
  },
  galleryItems: {
    containerId: "gallery-items-editor",
    title: "صورة",
    create: () => ({ image: "", alt: "" }),
    fields: [
      { key: "alt", label: "النص البديل", type: "text" },
      { key: "image", label: "الصورة", type: "image", full: true },
    ],
  },
  testimonialsItems: {
    containerId: "testimonials-items-editor",
    title: "بطاقة",
    create: () => ({ title: "", text: "" }),
    fields: [
      { key: "title", label: "العنوان", type: "text" },
      { key: "text", label: "الوصف", type: "textarea", full: true },
    ],
  },
  contactAddress: {
    containerId: "contact-address-editor",
    title: "سطر عنوان",
    create: () => "",
    fields: [{ key: "value", label: "السطر", type: "text", full: true }],
  },
};

function byId(id) {
  return document.getElementById(id);
}

function showStatus(message) {
  const status = byId("admin-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.removeAttribute("hidden");
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    status.setAttribute("hidden", "");
  }, 2500);
}

function setValue(id, value) {
  const field = byId(id);
  if (field) {
    field.value = value;
  }
}

function getValue(id) {
  return byId(id)?.value || "";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
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

function applyLengthRule(id, maxLength) {
  const field = byId(id);
  if (field) {
    field.maxLength = maxLength;
  }
}

function applyAdminFieldRules() {
  [
    "brand-name",
    "brand-tagline",
    "hero-eyebrow",
    "hero-title",
    "hero-tagline",
    "hero-primary-cta",
    "hero-secondary-cta",
    "about-label",
    "about-title",
    "about-experience-value",
    "about-experience-title",
    "products-label",
    "products-title",
    "products-details-label",
    "products-order-label",
    "why-label",
    "why-title",
    "gallery-label",
    "gallery-title",
    "testimonials-label",
    "testimonials-title",
    "contact-label",
    "contact-title",
    "contact-whatsapp-label",
    "contact-footer-whatsapp-label",
    "contact-map-label",
    "contact-footer-map-label",
  ].forEach((id) => applyLengthRule(id, 180));

  [
    "brand-footer-summary",
    "hero-text",
    "about-text-1",
    "about-text-2",
    "about-experience-text",
    "products-subtitle",
    "testimonials-subtitle",
    "contact-text",
  ].forEach((id) => applyLengthRule(id, 2000));

  ["brand-logo", "hero-image", "about-image", "contact-map-url"].forEach((id) => applyLengthRule(id, 4000));
  ["contact-whatsapp-display", "contact-phone-display"].forEach((id) => applyLengthRule(id, 20));
  applyLengthRule("contact-whatsapp-wa-number", 20);
}

function validateRequiredText(value, label, min = 1, max = 500) {
  const normalized = String(value || "").trim();
  if (normalized.length < min) {
    throw new Error(`${label} is required`);
  }
  if (normalized.length > max) {
    throw new Error(`${label} is too long`);
  }
}

function validateOptionalText(value, label, max = 2000) {
  const normalized = String(value || "").trim();
  if (normalized.length > max) {
    throw new Error(`${label} is too long`);
  }
}

function validateUrlLike(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return;
  }

  const isRelativeAsset = /^[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|svg|gif|ico)$/i.test(normalized);
  const isDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(normalized);
  if (normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../") || isRelativeAsset || isDataImage) {
    return;
  }

  try {
    const parsed = new URL(normalized);
    if (["http:", "https:", "tel:"].includes(parsed.protocol)) {
      return;
    }
  } catch (_error) {
    // Fall through.
  }

  throw new Error(`${label} is invalid`);
}

function validatePhone(value, label) {
  validateRequiredText(value, label, 7, 20);
  if (!/^[0-9+\s()/-]{7,20}$/.test(String(value).trim())) {
    throw new Error(`${label} format is invalid`);
  }
}

function validateDigits(value, label, min = 8, max = 20) {
  validateRequiredText(value, label, min, max);
  if (!/^[0-9]{8,20}$/.test(String(value).trim())) {
    throw new Error(`${label} format is invalid`);
  }
}

function validateContentDraft(content) {
  validateRequiredText(content.brand.name, "Brand name", 2, 120);
  validateRequiredText(content.brand.tagline, "Brand tagline", 2, 120);
  validateRequiredText(content.brand.footerSummary, "Brand footer summary", 10, 300);
  validateUrlLike(content.brand.logo, "Brand logo");

  validateRequiredText(content.hero.eyebrow, "Hero eyebrow", 2, 120);
  validateRequiredText(content.hero.title, "Hero title", 2, 120);
  validateRequiredText(content.hero.tagline, "Hero tagline", 2, 120);
  validateRequiredText(content.hero.text, "Hero text", 10, 600);
  validateRequiredText(content.hero.primaryCta, "Hero primary CTA", 2, 80);
  validateRequiredText(content.hero.secondaryCta, "Hero secondary CTA", 2, 80);
  validateUrlLike(content.hero.image, "Hero image");
  if (!Array.isArray(content.hero.trust) || content.hero.trust.length === 0) {
    throw new Error("Hero trust items are required");
  }
  content.hero.trust.forEach((item, index) => validateRequiredText(item, `Hero trust item ${index + 1}`, 2, 140));
  if (!Array.isArray(content.hero.metrics) || content.hero.metrics.length === 0) {
    throw new Error("Hero metrics are required");
  }
  content.hero.metrics.forEach((item, index) => {
    validateRequiredText(item.value, `Hero metric value ${index + 1}`, 1, 40);
    validateRequiredText(item.label, `Hero metric label ${index + 1}`, 2, 80);
  });

  validateRequiredText(content.about.label, "About label", 2, 80);
  validateRequiredText(content.about.title, "About title", 2, 180);
  validateRequiredText(content.about.text1, "About text 1", 10, 800);
  validateRequiredText(content.about.text2, "About text 2", 10, 800);
  validateRequiredText(content.about.experienceValue, "About experience value", 1, 20);
  validateRequiredText(content.about.experienceTitle, "About experience title", 2, 80);
  validateRequiredText(content.about.experienceText, "About experience text", 5, 220);
  validateUrlLike(content.about.image, "About image");

  validateRequiredText(content.products.label, "Products label", 2, 80);
  validateRequiredText(content.products.title, "Products title", 2, 180);
  validateRequiredText(content.products.subtitle, "Products subtitle", 10, 260);
  validateRequiredText(content.products.detailsLabel, "Products details label", 2, 80);
  validateRequiredText(content.products.orderLabel, "Products order label", 2, 80);
  if (!Array.isArray(content.products.items) || content.products.items.length === 0) {
    throw new Error("At least one product is required");
  }
  content.products.items.forEach((item, index) => {
    validateRequiredText(item.name, `Product name ${index + 1}`, 2, 120);
    validateRequiredText(item.description, `Product description ${index + 1}`, 5, 280);
    validateRequiredText(item.modalDescription, `Product modal description ${index + 1}`, 5, 500);
    validateUrlLike(item.image, `Product image ${index + 1}`);
  });

  validateRequiredText(content.whyUs.label, "Why us label", 2, 80);
  validateRequiredText(content.whyUs.title, "Why us title", 2, 180);
  if (!Array.isArray(content.whyUs.features) || content.whyUs.features.length === 0) {
    throw new Error("Why us features are required");
  }
  content.whyUs.features.forEach((item, index) => {
    validateRequiredText(item.title, `Feature title ${index + 1}`, 2, 120);
    validateRequiredText(item.text, `Feature text ${index + 1}`, 5, 300);
  });
  if (!Array.isArray(content.whyUs.trust) || content.whyUs.trust.length === 0) {
    throw new Error("Why us trust items are required");
  }
  content.whyUs.trust.forEach((item, index) => {
    validateRequiredText(item.title, `Trust title ${index + 1}`, 2, 120);
    validateRequiredText(item.text, `Trust text ${index + 1}`, 5, 300);
  });

  validateRequiredText(content.gallery.label, "Gallery label", 2, 80);
  validateRequiredText(content.gallery.title, "Gallery title", 2, 180);
  if (!Array.isArray(content.gallery.items) || content.gallery.items.length === 0) {
    throw new Error("Gallery items are required");
  }
  content.gallery.items.forEach((item, index) => {
    validateRequiredText(item.alt, `Gallery alt ${index + 1}`, 2, 160);
    validateUrlLike(item.image, `Gallery image ${index + 1}`);
  });

  validateRequiredText(content.testimonials.label, "Testimonials label", 2, 80);
  validateRequiredText(content.testimonials.title, "Testimonials title", 2, 180);
  validateRequiredText(content.testimonials.subtitle, "Testimonials subtitle", 5, 260);
  if (!Array.isArray(content.testimonials.items) || content.testimonials.items.length === 0) {
    throw new Error("Testimonials items are required");
  }
  content.testimonials.items.forEach((item, index) => {
    validateRequiredText(item.title, `Testimonial title ${index + 1}`, 2, 120);
    validateRequiredText(item.text, `Testimonial text ${index + 1}`, 5, 300);
  });

  validateRequiredText(content.contact.label, "Contact label", 2, 80);
  validateRequiredText(content.contact.title, "Contact title", 2, 180);
  validateRequiredText(content.contact.text, "Contact text", 10, 400);
  validatePhone(content.contact.whatsappDisplay, "Displayed WhatsApp number");
  validatePhone(content.contact.phoneDisplay, "Displayed phone number");
  validateDigits(content.contact.whatsappWaNumber, "WhatsApp wa.me number");
  validateRequiredText(content.contact.whatsappLabel, "Contact WhatsApp label", 2, 80);
  validateRequiredText(content.contact.footerWhatsappLabel, "Footer WhatsApp label", 2, 80);
  validateRequiredText(content.contact.mapLabel, "Map label", 2, 80);
  validateRequiredText(content.contact.footerMapLabel, "Footer map label", 2, 80);
  validateUrlLike(content.contact.mapUrl, "Map URL");
  if (!Array.isArray(content.contact.addressLines) || content.contact.addressLines.length === 0) {
    throw new Error("At least one address line is required");
  }
  content.contact.addressLines.forEach((line, index) => validateRequiredText(line, `Address line ${index + 1}`, 2, 160));
}

function createInput(field, value, arrayKey, index) {
  const wrapperClass = field.full ? "full" : "";
  const safeValue = typeof value === "string" ? value : "";
  const escapedValue = escapeHtml(safeValue);

  if (field.type === "textarea") {
    return `
      <label class="${wrapperClass}">
        <span>${field.label}</span>
        <textarea data-array="${arrayKey}" data-index="${index}" data-key="${field.key}" rows="4" maxlength="2000">${escapedValue}</textarea>
      </label>
    `;
  }

  if (field.type === "image") {
    return `
      <label class="${wrapperClass}">
        <span>${field.label}</span>
        <input data-array="${arrayKey}" data-index="${index}" data-key="${field.key}" type="text" value="${escapedValue}" maxlength="4000" />
        <input class="file-input array-file-input" data-array="${arrayKey}" data-index="${index}" data-key="${field.key}" type="file" accept="image/*" />
      </label>
    `;
  }

  return `
    <label class="${wrapperClass}">
      <span>${field.label}</span>
      <input data-array="${arrayKey}" data-index="${index}" data-key="${field.key}" type="text" value="${escapedValue}" maxlength="500" />
    </label>
  `;
}

function renderArrayEditor(arrayKey, items) {
  const config = arrayConfigs[arrayKey];
  const container = byId(config.containerId);
  if (!container) {
    return;
  }

  container.innerHTML = items
    .map((item, index) => {
      const fields = config.fields
        .map((field) => {
          const value = typeof item === "string" ? item : item[field.key] || "";
          return createInput(field, value, arrayKey, index);
        })
        .join("");

      return `
        <div class="editor-card" data-array-card="${arrayKey}" data-index="${index}">
          <div class="editor-card-header">
            <strong>${config.title} ${index + 1}</strong>
            <button class="remove-button" data-remove-array="${arrayKey}" data-index="${index}" type="button">حذف</button>
          </div>
          <div class="editor-card-grid">${fields}</div>
        </div>
      `;
    })
    .join("");
}

function populateForm() {
  setValue("brand-name", currentContent.brand.name);
  setValue("brand-tagline", currentContent.brand.tagline);
  setValue("brand-footer-summary", currentContent.brand.footerSummary);
  setValue("brand-logo", currentContent.brand.logo);

  setValue("hero-eyebrow", currentContent.hero.eyebrow);
  setValue("hero-title", currentContent.hero.title);
  setValue("hero-tagline", currentContent.hero.tagline);
  setValue("hero-text", currentContent.hero.text);
  setValue("hero-primary-cta", currentContent.hero.primaryCta);
  setValue("hero-secondary-cta", currentContent.hero.secondaryCta);
  setValue("hero-image", currentContent.hero.image);

  setValue("about-label", currentContent.about.label);
  setValue("about-title", currentContent.about.title);
  setValue("about-text-1", currentContent.about.text1);
  setValue("about-text-2", currentContent.about.text2);
  setValue("about-experience-value", currentContent.about.experienceValue);
  setValue("about-experience-title", currentContent.about.experienceTitle);
  setValue("about-experience-text", currentContent.about.experienceText);
  setValue("about-image", currentContent.about.image);

  setValue("products-label", currentContent.products.label);
  setValue("products-title", currentContent.products.title);
  setValue("products-subtitle", currentContent.products.subtitle);
  setValue("products-details-label", currentContent.products.detailsLabel);
  setValue("products-order-label", currentContent.products.orderLabel);

  setValue("why-label", currentContent.whyUs.label);
  setValue("why-title", currentContent.whyUs.title);

  setValue("gallery-label", currentContent.gallery.label);
  setValue("gallery-title", currentContent.gallery.title);

  setValue("testimonials-label", currentContent.testimonials.label);
  setValue("testimonials-title", currentContent.testimonials.title);
  setValue("testimonials-subtitle", currentContent.testimonials.subtitle);

  setValue("contact-label", currentContent.contact.label);
  setValue("contact-title", currentContent.contact.title);
  setValue("contact-text", currentContent.contact.text);
  setValue("contact-whatsapp-display", currentContent.contact.whatsappDisplay);
  setValue("contact-phone-display", currentContent.contact.phoneDisplay);
  setValue("contact-whatsapp-wa-number", currentContent.contact.whatsappWaNumber);
  setValue("contact-whatsapp-label", currentContent.contact.whatsappLabel);
  setValue("contact-footer-whatsapp-label", currentContent.contact.footerWhatsappLabel);
  setValue("contact-map-label", currentContent.contact.mapLabel);
  setValue("contact-footer-map-label", currentContent.contact.footerMapLabel);
  setValue("contact-map-url", currentContent.contact.mapUrl);

  renderArrayEditor("heroTrust", currentContent.hero.trust);
  renderArrayEditor("heroMetrics", currentContent.hero.metrics);
  renderArrayEditor("productsItems", currentContent.products.items);
  renderArrayEditor("whyFeatures", currentContent.whyUs.features);
  renderArrayEditor("whyTrust", currentContent.whyUs.trust);
  renderArrayEditor("galleryItems", currentContent.gallery.items);
  renderArrayEditor("testimonialsItems", currentContent.testimonials.items);
  renderArrayEditor("contactAddress", currentContent.contact.addressLines);
}

function collectArray(arrayKey) {
  const config = arrayConfigs[arrayKey];
  const cards = [...document.querySelectorAll(`[data-array-card="${arrayKey}"]`)];

  return cards.map((card, index) => {
    if (config.fields.length === 1 && config.fields[0].key === "value") {
      return card.querySelector(`[data-array="${arrayKey}"][data-index="${index}"][data-key="value"]`)?.value || "";
    }

    const item = {};
    config.fields.forEach((field) => {
      const element = card.querySelector(
        `[data-array="${arrayKey}"][data-index="${index}"][data-key="${field.key}"]`
      );
      item[field.key] = element?.value || "";
    });
    return item;
  });
}

function collectForm() {
  return {
    brand: {
      name: getValue("brand-name"),
      tagline: getValue("brand-tagline"),
      logo: getValue("brand-logo"),
      footerSummary: getValue("brand-footer-summary"),
    },
    hero: {
      eyebrow: getValue("hero-eyebrow"),
      title: getValue("hero-title"),
      tagline: getValue("hero-tagline"),
      text: getValue("hero-text"),
      primaryCta: getValue("hero-primary-cta"),
      secondaryCta: getValue("hero-secondary-cta"),
      image: getValue("hero-image"),
      trust: collectArray("heroTrust"),
      metrics: collectArray("heroMetrics"),
    },
    about: {
      label: getValue("about-label"),
      title: getValue("about-title"),
      text1: getValue("about-text-1"),
      text2: getValue("about-text-2"),
      experienceValue: getValue("about-experience-value"),
      experienceTitle: getValue("about-experience-title"),
      experienceText: getValue("about-experience-text"),
      image: getValue("about-image"),
    },
    products: {
      label: getValue("products-label"),
      title: getValue("products-title"),
      subtitle: getValue("products-subtitle"),
      detailsLabel: getValue("products-details-label"),
      orderLabel: getValue("products-order-label"),
      items: collectArray("productsItems"),
    },
    whyUs: {
      label: getValue("why-label"),
      title: getValue("why-title"),
      features: collectArray("whyFeatures"),
      trust: collectArray("whyTrust"),
    },
    gallery: {
      label: getValue("gallery-label"),
      title: getValue("gallery-title"),
      items: collectArray("galleryItems"),
    },
    testimonials: {
      label: getValue("testimonials-label"),
      title: getValue("testimonials-title"),
      subtitle: getValue("testimonials-subtitle"),
      items: collectArray("testimonialsItems"),
    },
    contact: {
      label: getValue("contact-label"),
      title: getValue("contact-title"),
      text: getValue("contact-text"),
      whatsappDisplay: getValue("contact-whatsapp-display"),
      phoneDisplay: getValue("contact-phone-display"),
      whatsappWaNumber: getValue("contact-whatsapp-wa-number"),
      whatsappLabel: getValue("contact-whatsapp-label"),
      footerWhatsappLabel: getValue("contact-footer-whatsapp-label"),
      mapLabel: getValue("contact-map-label"),
      footerMapLabel: getValue("contact-footer-map-label"),
      addressLines: collectArray("contactAddress"),
      mapUrl: getValue("contact-map-url"),
    },
  };
}

function downloadJsonFile(fileName, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function setOrdersNotificationState(isOpen) {
  if (!ordersNotificationToggle || !ordersNotificationPanel) {
    return;
  }

  ordersNotificationToggle.classList.toggle("is-active", isOpen);
  ordersNotificationToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    ordersNotificationPanel.removeAttribute("hidden");
  } else {
    ordersNotificationPanel.setAttribute("hidden", "");
  }
}

async function loadOrders() {
  const container = byId("orders-list");
  if (!container) {
    return;
  }

  try {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    const orders = await response.json();
    if (ordersNotificationCount) {
      ordersNotificationCount.textContent = Array.isArray(orders) ? String(orders.length) : "0";
    }
    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = '<p class="order-empty">لا توجد طلبات حتى الآن.</p>';
      return;
    }

    container.innerHTML = orders
      .map(
        (order) => `
          <article class="order-card">
            <h3>${order.firstName} ${order.lastName} ${order.thirdName}</h3>
            <div class="order-meta">
              <div><strong>Phone</strong><span>${order.phone}</span></div>
              <div><strong>WhatsApp</strong><span>${order.whatsapp}</span></div>
              <div><strong>Country</strong><span>${order.country}</span></div>
              <div><strong>Governorate</strong><span>${order.governorate}</span></div>
              <div><strong>Payment</strong><span>${order.paymentMethod}</span></div>
              <div><strong>Created</strong><span>${new Date(order.createdAt).toLocaleString()}</span></div>
              <div class="full"><strong>Items</strong><span>${Array.isArray(order.items) && order.items.length > 0 ? order.items.map((item) => `${item.name} x${item.quantity}`).join(" | ") : "-"}</span></div>
              <div class="full"><strong>Notes</strong><span>${order.notes || "-"}</span></div>
            </div>
          </article>
        `
      )
      .join("");
  } catch (_error) {
    if (ordersNotificationCount) {
      ordersNotificationCount.textContent = "0";
    }
    container.innerHTML = '<p class="order-empty">تعذر تحميل الطلبات حالياً.</p>';
  }
}

function wireOrdersNotification() {
  ordersNotificationToggle?.addEventListener("click", () => {
    const isOpen = ordersNotificationPanel?.hasAttribute("hidden");
    setOrdersNotificationState(Boolean(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!ordersNotificationPanel || !ordersNotificationToggle) {
      return;
    }

    if (ordersNotificationPanel.hasAttribute("hidden")) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!ordersNotificationPanel.contains(target) && !ordersNotificationToggle.contains(target)) {
      setOrdersNotificationState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOrdersNotificationState(false);
    }
  });
}

function wireFileInputs() {
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file") {
      return;
    }

    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showStatus("Only image files are allowed.");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showStatus("Image size must be 5MB or less.");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const targetId = input.dataset.target;
      if (targetId) {
        setValue(targetId, result);
      }

      const array = input.dataset.array;
      const index = input.dataset.index;
      const key = input.dataset.key;
      if (array && index !== undefined && key) {
        const target = document.querySelector(
          `[data-array="${array}"][data-index="${index}"][data-key="${key}"]`
        );
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          target.value = result;
        }
      }
    };

    reader.readAsDataURL(file);
  });
}

function wireArrayActions() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const addKey = target.dataset.addArray;
    if (addKey) {
      if (addKey === "hero-trust") {
        currentContent.hero.trust.push("");
        renderArrayEditor("heroTrust", currentContent.hero.trust);
      }
      if (addKey === "hero-metrics") {
        currentContent.hero.metrics.push(arrayConfigs.heroMetrics.create());
        renderArrayEditor("heroMetrics", currentContent.hero.metrics);
      }
      if (addKey === "products-items") {
        currentContent.products.items.push(arrayConfigs.productsItems.create());
        renderArrayEditor("productsItems", currentContent.products.items);
      }
      if (addKey === "why-features") {
        currentContent.whyUs.features.push(arrayConfigs.whyFeatures.create());
        renderArrayEditor("whyFeatures", currentContent.whyUs.features);
      }
      if (addKey === "why-trust") {
        currentContent.whyUs.trust.push(arrayConfigs.whyTrust.create());
        renderArrayEditor("whyTrust", currentContent.whyUs.trust);
      }
      if (addKey === "gallery-items") {
        currentContent.gallery.items.push(arrayConfigs.galleryItems.create());
        renderArrayEditor("galleryItems", currentContent.gallery.items);
      }
      if (addKey === "testimonials-items") {
        currentContent.testimonials.items.push(arrayConfigs.testimonialsItems.create());
        renderArrayEditor("testimonialsItems", currentContent.testimonials.items);
      }
      if (addKey === "contact-address") {
        currentContent.contact.addressLines.push("");
        renderArrayEditor("contactAddress", currentContent.contact.addressLines);
      }
    }

    const removeKey = target.dataset.removeArray;
    if (removeKey) {
      const index = Number(target.dataset.index);
      if (removeKey === "heroTrust") {
        currentContent.hero.trust.splice(index, 1);
        renderArrayEditor("heroTrust", currentContent.hero.trust);
      }
      if (removeKey === "heroMetrics") {
        currentContent.hero.metrics.splice(index, 1);
        renderArrayEditor("heroMetrics", currentContent.hero.metrics);
      }
      if (removeKey === "productsItems") {
        currentContent.products.items.splice(index, 1);
        renderArrayEditor("productsItems", currentContent.products.items);
      }
      if (removeKey === "whyFeatures") {
        currentContent.whyUs.features.splice(index, 1);
        renderArrayEditor("whyFeatures", currentContent.whyUs.features);
      }
      if (removeKey === "whyTrust") {
        currentContent.whyUs.trust.splice(index, 1);
        renderArrayEditor("whyTrust", currentContent.whyUs.trust);
      }
      if (removeKey === "galleryItems") {
        currentContent.gallery.items.splice(index, 1);
        renderArrayEditor("galleryItems", currentContent.gallery.items);
      }
      if (removeKey === "testimonialsItems") {
        currentContent.testimonials.items.splice(index, 1);
        renderArrayEditor("testimonialsItems", currentContent.testimonials.items);
      }
      if (removeKey === "contactAddress") {
        currentContent.contact.addressLines.splice(index, 1);
        renderArrayEditor("contactAddress", currentContent.contact.addressLines);
      }
    }
  });
}

function wireMainActions() {
  byId("save-button")?.addEventListener("click", async () => {
    try {
      currentContent = collectForm();
      validateContentDraft(currentContent);
      await manager.saveContent(currentContent);
      showStatus("تم حفظ البيانات. افتح الموقع أو حدّثه لرؤية التغييرات.");
    } catch (error) {
      if (error.message === "Unauthorized") {
        window.location.href = "/login.html";
        return;
      }
      showStatus(error.message || "فشل حفظ البيانات.");
    }
  });

  byId("reset-button")?.addEventListener("click", async () => {
    try {
      currentContent = await manager.resetContent();
      populateForm();
      showStatus("تمت استعادة القيم الافتراضية.");
    } catch (error) {
      if (error.message === "Unauthorized") {
        window.location.href = "/login.html";
        return;
      }
      showStatus(error.message || "فشل استعادة القيم الافتراضية.");
    }
  });

  byId("export-button")?.addEventListener("click", async () => {
    try {
      currentContent = collectForm();
      validateContentDraft(currentContent);
      await manager.saveContent(currentContent);
      downloadJsonFile("alhelwany-site-content.json", JSON.stringify(currentContent, null, 2));
      showStatus("تم تصدير ملف JSON.");
    } catch (error) {
      if (error.message === "Unauthorized") {
        window.location.href = "/login.html";
        return;
      }
      showStatus(error.message || "فشل تصدير البيانات.");
    }
  });

  byId("fill-export-button")?.addEventListener("click", () => {
    byId("import-export-json").value = JSON.stringify(collectForm(), null, 2);
  });

  byId("import-button")?.addEventListener("click", async () => {
    const text = byId("import-export-json").value.trim();
    if (!text) {
      showStatus("الصق JSON أولاً.");
      return;
    }

    try {
      const parsed = JSON.parse(text);
      validateContentDraft(parsed);
      currentContent = await manager.importContent(text);
      populateForm();
      showStatus("تم استيراد البيانات بنجاح.");
    } catch (error) {
      showStatus(error.message || "فشل استيراد JSON. تأكد من صحة التنسيق.");
    }
  });

  byId("logout-button")?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
  });

  byId("refresh-orders-button")?.addEventListener("click", async () => {
    await loadOrders();
  });
}

async function init() {
  currentContent = await manager.loadContent();
  populateForm();
  applyAdminFieldRules();
  wireFileInputs();
  wireArrayActions();
  wireMainActions();
  wireOrdersNotification();
  await loadOrders();
}

init();
