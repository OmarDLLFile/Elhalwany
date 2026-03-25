const contentManager = window.SiteContentManager;
let content = null;

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a[href^='#']");
const pageBackdrop = document.querySelector(".page-backdrop");
const productModal = document.querySelector("#product-modal");
const productModalTitle = document.querySelector("#product-modal-title");
const productModalDescription = document.querySelector("#product-modal-description");
const productModalImage = document.querySelector("#product-modal-image");
const productModalWhatsapp = document.querySelector("#product-modal-whatsapp");
const galleryLightbox = document.querySelector("#gallery-lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const orderForm = document.querySelector("#order-form");
const orderCountry = document.querySelector("#order-country");
const orderGovernorate = document.querySelector("#order-governorate");
const orderStatus = document.querySelector("#order-form-status");

const countryGovernorates = {
  Egypt: ["Cairo", "Giza", "Alexandria", "Dakahlia", "Sharqia", "Qalyubia"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  Kuwait: ["Al Asimah", "Hawalli", "Farwaniya", "Ahmadi"],
  Qatar: ["Doha", "Al Rayyan", "Al Wakrah", "Umm Salal"],
};

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const node = byId(id);
  if (node) {
    node.textContent = value;
  }
}

function setImage(id, src, alt) {
  const node = byId(id);
  if (node) {
    node.src = src;
    if (alt) {
      node.alt = alt;
    }
  }
}

function setLink(id, href) {
  const node = byId(id);
  if (node) {
    node.href = href;
  }
}

function renderHero() {
  setText("nav-brand-name", content.brand.name);
  setText("nav-brand-tagline", content.brand.tagline);
  setText("hero-eyebrow", content.hero.eyebrow);
  setText("hero-title", content.hero.title);
  setText("hero-tagline", content.hero.tagline);
  setText("hero-text", content.hero.text);
  setText("nav-order-label", content.hero.primaryCta);
  setText("hero-primary-label", content.hero.primaryCta);
  setText("hero-secondary-label", content.hero.secondaryCta);

  setImage("brand-logo", content.brand.logo, `شعار ${content.brand.name}`);
  setImage("footer-logo", content.brand.logo, `شعار ${content.brand.name}`);
  setImage("hero-image", content.hero.image, content.hero.title);

  const trustStrip = byId("hero-trust-strip");
  if (trustStrip) {
    trustStrip.innerHTML = content.hero.trust
      .map((item) => `<span>${item}</span>`)
      .join("");
  }

  const metrics = byId("hero-metrics");
  if (metrics) {
    metrics.innerHTML = content.hero.metrics
      .map(
        (item) => `
          <div>
            <strong>${item.value}</strong>
            <span>${item.label}</span>
          </div>
        `
      )
      .join("");
  }
}

function renderAbout() {
  setText("about-label", content.about.label);
  setText("about-title", content.about.title);
  setText("about-text-1", content.about.text1);
  setText("about-text-2", content.about.text2);
  setText("about-experience-value", content.about.experienceValue);
  setText("about-experience-title", content.about.experienceTitle);
  setText("about-experience-text", content.about.experienceText);
  setImage("about-image", content.about.image, content.about.title);
}

function renderProducts() {
  setText("products-label", content.products.label);
  setText("products-title", content.products.title);
  setText("products-subtitle", content.products.subtitle);

  const grid = byId("products-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = content.products.items
    .map((item) => {
      const orderUrl = contentManager.buildWhatsAppUrl(
        content.contact.whatsappWaNumber,
        `مرحباً، أريد طلب صنف ${item.name} من ${content.brand.name}.`
      );

      return `
        <article
          class="product-card reveal"
          data-product-name="${item.name}"
          data-product-description="${item.modalDescription}"
          data-product-image="${item.image}"
        >
          <img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" />
          <div class="product-card-body">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="product-actions">
              <button class="button product-modal-trigger" type="button">${content.products.detailsLabel}</button>
              <a class="product-link" href="${orderUrl}" target="_blank" rel="noopener noreferrer">${content.products.orderLabel}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWhyUs() {
  setText("why-label", content.whyUs.label);
  setText("why-title", content.whyUs.title);

  const featuresGrid = byId("features-grid");
  if (featuresGrid) {
    featuresGrid.innerHTML = content.whyUs.features
      .map(
        (item) => `
          <article class="feature-card reveal">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </article>
        `
      )
      .join("");
  }

  const trustBand = byId("trust-band");
  if (trustBand) {
    trustBand.innerHTML = content.whyUs.trust
      .map(
        (item) => `
          <div class="trust-item">
            <strong>${item.title}</strong>
            <span>${item.text}</span>
          </div>
        `
      )
      .join("");
  }
}

function renderGallery() {
  setText("gallery-label", content.gallery.label);
  setText("gallery-title", content.gallery.title);

  const grid = byId("gallery-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = content.gallery.items
    .map(
      (item) => `
        <figure class="gallery-card reveal">
          <img src="${item.image}" alt="${item.alt}" loading="lazy" decoding="async" />
          <button class="gallery-zoom" type="button" aria-label="تكبير الصورة"></button>
        </figure>
      `
    )
    .join("");
}

function renderTestimonials() {
  setText("testimonials-label", content.testimonials.label);
  setText("testimonials-title", content.testimonials.title);
  setText("testimonials-subtitle", content.testimonials.subtitle);

  const grid = byId("testimonials-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = content.testimonials.items
    .map(
      (item) => `
        <article class="testimonial-card reveal">
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function renderContact() {
  setText("contact-label", content.contact.label);
  setText("contact-title", content.contact.title);
  setText("contact-text", content.contact.text);
  setText("contact-whatsapp-label", content.contact.whatsappLabel);
  setText("contact-whatsapp-display", content.contact.whatsappDisplay);
  setText("contact-phone-display", content.contact.phoneDisplay);
  setText("contact-map-label", content.contact.mapLabel);
  setText("footer-brand-name", content.brand.name);
  setText("footer-summary", content.brand.footerSummary);
  setText("footer-phone-display", content.contact.phoneDisplay);
  setText("footer-whatsapp-label", content.contact.footerWhatsappLabel);
  setText("footer-map-label", content.contact.footerMapLabel);

  const address = byId("contact-address");
  if (address) {
    address.innerHTML = content.contact.addressLines.join("<br />");
  }

  const waUrl = contentManager.buildWhatsAppUrl(content.contact.whatsappWaNumber, "");
  setLink("floating-whatsapp-link", waUrl);
  setLink("mobile-whatsapp-link", waUrl);
  setLink("hero-primary-link", waUrl);
  setLink("contact-whatsapp-link", waUrl);
  setLink("contact-whatsapp-display-link", waUrl);
  setLink("footer-whatsapp-link", waUrl);

  setLink("mobile-call-link", `tel:${content.contact.phoneDisplay}`);
  setLink("contact-phone-link", `tel:${content.contact.phoneDisplay}`);
  setLink("footer-phone-link", `tel:${content.contact.phoneDisplay}`);

  setLink("mobile-map-link", content.contact.mapUrl);
  setLink("contact-map-link", content.contact.mapUrl);
  setLink("footer-map-link", content.contact.mapUrl);
}

function applyContent() {
  renderHero();
  renderAbout();
  renderProducts();
  renderWhyUs();
  renderGallery();
  renderTestimonials();
  renderContact();
}

function populateCountries() {
  if (!orderCountry || !orderGovernorate) {
    return;
  }

  orderCountry.innerHTML = Object.keys(countryGovernorates)
    .map((country) => `<option value="${country}">${country}</option>`)
    .join("");

  populateGovernorates(orderCountry.value);
}

function populateGovernorates(country) {
  if (!orderGovernorate) {
    return;
  }

  const governorates = countryGovernorates[country] || [];
  orderGovernorate.innerHTML = governorates
    .map((governorate) => `<option value="${governorate}">${governorate}</option>`)
    .join("");
}

function setPageLocked(locked) {
  document.body.classList.toggle("is-locked", locked);
}

function closeNavMenu() {
  if (!navMenu || !navToggle) {
    return;
  }

  navMenu.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  if (!(productModal?.hidden ?? true) || !(galleryLightbox?.hidden ?? true)) {
    return;
  }
  pageBackdrop?.setAttribute("hidden", "");
  setPageLocked(false);
}

function openOverlay() {
  pageBackdrop?.removeAttribute("hidden");
  setPageLocked(true);
}

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.setAttribute("hidden", "");
  if (
    !navMenu?.classList.contains("is-open") &&
    (productModal?.hidden ?? true) &&
    (galleryLightbox?.hidden ?? true)
  ) {
    pageBackdrop?.setAttribute("hidden", "");
    setPageLocked(false);
  }
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupSectionHighlighting() {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: 0.1,
    }
  );

  document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
}

function setupNavigation() {
  if (!navToggle || !navMenu) {
    return;
  }

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      openOverlay();
    } else if ((productModal?.hidden ?? true) && (galleryLightbox?.hidden ?? true)) {
      pageBackdrop?.setAttribute("hidden", "");
      setPageLocked(false);
    }
  });

  navLinks.forEach((link) => link.addEventListener("click", closeNavMenu));

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("is-open")) {
      return;
    }

    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
      closeNavMenu();
    }
  });
}

function setupProductModal() {
  document.querySelectorAll(".product-modal-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const card = trigger.closest(".product-card");
      if (!card) {
        return;
      }

      const name = card.dataset.productName || "";
      const description = card.dataset.productDescription || "";
      const image = card.dataset.productImage || "";
      const waUrl = contentManager.buildWhatsAppUrl(
        content.contact.whatsappWaNumber,
        `مرحباً، أريد طلب صنف ${name} من ${content.brand.name}.`
      );

      if (productModalTitle) {
        productModalTitle.textContent = name;
      }
      if (productModalDescription) {
        productModalDescription.textContent = description;
      }
      if (productModalImage) {
        productModalImage.src = image;
        productModalImage.alt = name;
      }
      if (productModalWhatsapp) {
        productModalWhatsapp.href = waUrl;
      }

      productModal?.removeAttribute("hidden");
      openOverlay();
    });
  });
}

function setupGalleryLightbox() {
  document.querySelectorAll(".gallery-card").forEach((card) => {
    const button = card.querySelector(".gallery-zoom");
    const image = card.querySelector("img");

    button?.addEventListener("click", () => {
      if (!image || !lightboxImage) {
        return;
      }

      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      galleryLightbox?.removeAttribute("hidden");
      openOverlay();
    });
  });
}

function setupCloseActions() {
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.closest(".modal, .lightbox"));
    });
  });

  pageBackdrop?.addEventListener("click", () => {
    closeNavMenu();
    closeModal(productModal);
    closeModal(galleryLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeNavMenu();
    closeModal(productModal);
    closeModal(galleryLightbox);
  });
}

function setupOrderForm() {
  populateCountries();

  orderCountry?.addEventListener("change", () => {
    populateGovernorates(orderCountry.value);
  });

  orderForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!orderForm || !orderStatus) {
      return;
    }

    const formData = new FormData(orderForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ error: "Failed to submit order" }));
        throw new Error(errorPayload.error || "Failed to submit order");
      }

      orderForm.reset();
      populateCountries();
      orderStatus.textContent = "Order submitted successfully. The admin can now review it.";
      orderStatus.removeAttribute("hidden");
    } catch (error) {
      orderStatus.textContent = error.message || "Failed to submit order.";
      orderStatus.removeAttribute("hidden");
    }
  });
}

async function init() {
  content = await contentManager.loadContent();
  applyContent();
  setupRevealAnimations();
  setupSectionHighlighting();
  setupNavigation();
  setupProductModal();
  setupGalleryLightbox();
  setupCloseActions();
  setupOrderForm();
}

init();
