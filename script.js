const contentManager = window.SiteContentManager;
let content = null;
let revealObserver = null;

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
const langToggle = document.querySelector("#lang-toggle");
const themeToggle = document.querySelector("#theme-toggle");

const LANGUAGE_KEY = "alhelwany-site-language";
const THEME_KEY = "alhelwany-site-theme";
const systemThemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
let currentLanguage = window.localStorage.getItem(LANGUAGE_KEY) || "ar";
const savedThemePreference = window.localStorage.getItem(THEME_KEY);
let currentTheme =
  savedThemePreference === "light" || savedThemePreference === "dark"
    ? savedThemePreference
    : "system";

const translations = {
  ar: {
    metaTitle: "مخللات الحلواني | طبيعي.. صحي.. طازج",
    metaDescription:
      "مخللات الحلواني - طبيعي.. صحي.. طازج. أكثر من 25 سنة من الخبرة في صناعة المخللات المصرية بجودة عالية ومكونات طبيعية.",
    floatingWhatsapp: "واتساب",
    nav: {
      about: "من نحن",
      products: "المنتجات",
      why: "لماذا نحن",
      gallery: "المعرض",
      order: "الطلب",
      contact: "تواصل",
      toggle: "EN",
      themeLight: "فاتح",
      themeDark: "داكن",
    },
    hero: {
      eyebrow: "نكهة مصرية أصيلة بلمسة عصرية",
      title: "مخللات الحلواني",
      tagline: "طبيعي.. صحي.. طازج",
      text: "تشكيلة فاخرة من الزيتون والخيار واللفت والجزر والبصل والمشكل، مصنوعة من مكونات طبيعية وطازجة بخبرة تتجاوز 25 عاماً.",
      primaryCta: "اطلب الآن",
      secondaryCta: "اكتشف المنتجات",
      trust: [
        "توصيل سريع داخل الجيزة والقاهرة الكبرى",
        "تحضير يومي بمكونات طبيعية",
        "مناسب للمنازل والمطاعم",
      ],
      metrics: [
        { value: "25+", label: "سنة خبرة" },
        { value: "100%", label: "مكونات طبيعية" },
        { value: "6+", label: "أصناف أساسية" },
      ],
    },
    about: {
      label: "من نحن",
      title: "أكثر من 25 سنة من الطعم الذي يكمّل كل أكلة",
      text1:
        'بدأت رحلة "مخللات الحلواني" من حب الطرشي المصري الأصيل، ومع مرور السنوات تحولت الخبرة إلى علامة تثق بها العائلات والمطاعم الباحثة عن الطعم النظيف والجودة الثابتة.',
      text2:
        "نعتمد على اختيار خامات طازجة وتحضير دقيق يحافظ على القرمشة والنكهة، لنقدّم مخللات فاخرة بطابع عصري يواكب الذوق الحديث.",
      experienceValue: "25+",
      experienceTitle: "سنة خبرة",
      experienceText: "في إنتاج المخللات المصرية الطبيعية بجودة لا تساوم.",
    },
    products: {
      label: "منتجاتنا",
      title: "تشكيلة مختارة بعناية",
      subtitle: "كل صنف مصمم ليقدّم توازن مثالي بين الطعم، القرمشة، والانتعاش.",
      orderLabel: "اطلب الصنف",
      detailsLabel: "عرض التفاصيل",
      items: [
        ["زيتون", "زيتون مختار بعناية بطعم متوازن ولمسة ملحية مدروسة.", "زيتون مختار بعناية بطعم متوازن ولمسة ملحية مدروسة. مناسب للتقديم اليومي والمطاعم."],
        ["خيار مخلل", "حبات مقرمشة بطزاجة واضحة ونكهة مصرية أصلية.", "حبات خيار مقرمشة بطزاجة واضحة ونكهة مصرية أصلية. مثالي مع السندوتشات والأطباق الشعبية."],
        ["لفت", "لون مميز وقوام متماسك مع طعم خفيف ومنعش.", "لفت بلونه المميز وقوامه المتماسك مع طعم خفيف ومنعش يكمّل السفرة المصرية."],
        ["جزر", "شرائح جزر طازجة تضيف قرمشة محببة ولمسة مشرقة للمائدة.", "شرائح جزر طازجة تضيف قرمشة محببة ولمسة مشرقة للمائدة مع توازن ممتاز في الطعم."],
        ["بصل مخلل", "بصل صغير بنكهة متوازنة مثالي للتقديم مع الأطباق الشعبية.", "بصل صغير بنكهة متوازنة مثالي للتقديم مع الأطباق الشعبية والمشويات والوجبات السريعة."],
        ["مشكل", "مزيج غني من أكثر الأصناف طلباً في برطمان واحد فاخر.", "مزيج غني من أكثر الأصناف طلباً في برطمان واحد فاخر، مناسب للعائلة والضيافة."],
      ],
    },
    whyUs: {
      label: "لماذا نحن",
      title: "جودة واضحة من أول نظرة وأول طعم",
      features: [
        ["منتجات طازجة", "نختار المكونات في أفضل حالاتها لنحافظ على القوام والنكهة."],
        ["مكونات طبيعية", "تحضير نظيف يعتمد على وصفات متوازنة دون التنازل عن الجودة."],
        ["25+ سنة خبرة", "معرفة طويلة بالسوق والذوق المصري في أدق تفاصيل المنتج."],
        ["جودة عالية", "هوية بصرية حديثة وطعم ثابت يناسب البيع والتوزيع والضيافة."],
      ],
      trust: [
        ["مناطق التوصيل", "كفر طهرمس، بولاق الدكرور، الجيزة، والقاهرة الكبرى حسب الطلب."],
        ["وعد الطزاجة", "تحضير دقيق للحفاظ على القرمشة والنكهة الطبيعية في كل عبوة."],
        ["للمنازل والمطاعم", "أحجام مناسبة للتجزئة والجملة مع جودة ثابتة في كل مرة."],
      ],
    },
    gallery: { label: "المعرض", title: "هوية شهية وصور تبرز المنتج كما هو" },
    testimonials: {
      label: "ثقة العملاء",
      title: "الطعم الذي يرجع له الناس مرة بعد مرة",
      subtitle: "مؤشرات ثقة سريعة تعكس طريقة تقديم العلامة وجودة المنتج في الاستخدام اليومي.",
      items: [
        ["مناسب للسفرة اليومية", "طعم متوازن وقرمشة واضحة تجعله اختياراً ثابتاً بجانب الوجبات المنزلية والسندوتشات."],
        ["ملائم للمطاعم والطلبات المتكررة", "ثبات في الجودة وسهولة في الطلب عبر واتساب، مع تشكيلة تغطي الأصناف الأكثر طلباً."],
        ["هوية حديثة ومنتج واضح", "التقديم البصري العصري يساعد العلامة على الظهور بشكل أنظف وأكثر احترافية أمام العملاء."],
      ],
    },
    order: {
      label: "طلب جديد",
      title: "أرسل بيانات الطلب والدفع",
      text: 'املأ البيانات التالية وسنراجع الطلب من لوحة الإدارة. اختيار "Visa" أو "Credit Card" هنا هو تفضيل للدفع فقط وليس بوابة دفع إلكترونية مكتملة بعد.',
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      thirdName: "الاسم الثالث",
      phone: "رقم الهاتف",
      whatsapp: "رقم واتساب",
      country: "الدولة",
      governorate: "المحافظة",
      paymentMethod: "طريقة الدفع",
      notes: "ملاحظات",
      notesPlaceholder: "ملاحظات إضافية على الطلب",
      submit: "إرسال الطلب",
      paymentOptions: {
        cod: "الدفع عند الاستلام",
        visa: "فيزا",
        card: "بطاقة ائتمانية",
      },
      success: "تم إرسال الطلب بنجاح. يمكن للمشرف مراجعته الآن.",
      failure: "فشل إرسال الطلب.",
    },
    contact: {
      label: "تواصل معنا",
      title: "الطلب الأسرع عبر واتساب",
      text: "للحجز والاستفسار وطلبات الجملة أو التجزئة، تواصل مباشرة عبر واتساب وسنرد عليك بأسرع وقت.",
      whatsappLabel: "راسلنا على واتساب",
      mapLabel: "عرض على الخريطة",
      footerWhatsappLabel: "اطلب عبر واتساب",
      footerMapLabel: "عرض الموقع",
    },
    mobileCta: { call: "اتصال", whatsapp: "واتساب", map: "الخريطة" },
    countries: {
      Egypt: { label: "مصر", governorates: ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "القليوبية"] },
      "Saudi Arabia": { label: "السعودية", governorates: ["الرياض", "جدة", "مكة", "المدينة", "الدمام"] },
      UAE: { label: "الإمارات", governorates: ["دبي", "أبو ظبي", "الشارقة", "عجمان"] },
      Kuwait: { label: "الكويت", governorates: ["العاصمة", "حولي", "الفروانية", "الأحمدي"] },
      Qatar: { label: "قطر", governorates: ["الدوحة", "الريان", "الوكرة", "أم صلال"] },
    },
  },
  en: {
    metaTitle: "Al Helwany Pickles | Natural.. Healthy.. Fresh",
    metaDescription:
      "Al Helwany Pickles offers premium Egyptian pickles made with natural ingredients, fresh flavor, and more than 25 years of experience.",
    floatingWhatsapp: "WhatsApp",
    nav: {
      about: "About",
      products: "Products",
      why: "Why Us",
      gallery: "Gallery",
      order: "Order",
      contact: "Contact",
      toggle: "AR",
      themeLight: "Light",
      themeDark: "Dark",
    },
    hero: {
      eyebrow: "Authentic Egyptian flavor with a modern premium touch",
      title: "Al Helwany Pickles",
      tagline: "Natural.. Healthy.. Fresh",
      text: "A premium range of olives, cucumbers, turnips, carrots, onions, and mixed pickles crafted with fresh natural ingredients and over 25 years of experience.",
      primaryCta: "Order Now",
      secondaryCta: "Explore Products",
      trust: [
        "Fast delivery across Giza and Greater Cairo",
        "Prepared daily with natural ingredients",
        "Suitable for homes and restaurants",
      ],
      metrics: [
        { value: "25+", label: "Years of experience" },
        { value: "100%", label: "Natural ingredients" },
        { value: "6+", label: "Core varieties" },
      ],
    },
    about: {
      label: "About Us",
      title: "More than 25 years of flavor that completes every meal",
      text1:
        'Al Helwany Pickles began from a love of authentic Egyptian pickles, then grew into a trusted brand for families and restaurants looking for clean taste and reliable quality.',
      text2:
        "We choose fresh ingredients and prepare them carefully to preserve crunch and flavor, delivering premium pickles with a modern brand feel.",
      experienceValue: "25+",
      experienceTitle: "Years of Experience",
      experienceText: "Producing premium Egyptian pickles with quality we do not compromise on.",
    },
    products: {
      label: "Our Products",
      title: "A carefully selected range",
      subtitle: "Each variety is designed to deliver the right balance of flavor, crunch, and freshness.",
      orderLabel: "Order Item",
      detailsLabel: "View Details",
      items: [
        ["Olives", "Carefully selected olives with balanced flavor and refined seasoning.", "Carefully selected olives with balanced flavor and refined seasoning, suitable for daily serving and restaurants."],
        ["Pickled Cucumbers", "Crisp cucumbers with a distinctly fresh Egyptian flavor.", "Crisp cucumbers with a distinctly fresh Egyptian flavor, ideal with sandwiches and traditional dishes."],
        ["Turnips", "A vibrant color and firm texture with a light refreshing taste.", "Turnips with a vibrant color, firm texture, and refreshing taste that complements the Egyptian table."],
        ["Carrots", "Fresh carrot slices that add brightness and satisfying crunch.", "Fresh carrot slices that add brightness and satisfying crunch with a balanced taste profile."],
        ["Pickled Onions", "Small onions with balanced flavor for classic side servings.", "Small onions with balanced flavor, ideal for popular dishes, grilled meals, and quick bites."],
        ["Mixed Pickles", "A rich mix of the most requested varieties in one jar.", "A rich mix of the most requested varieties in one premium jar, perfect for family tables and hospitality."],
      ],
    },
    whyUs: {
      label: "Why Choose Us",
      title: "Quality you can see from the first glance and first bite",
      features: [
        ["Fresh Products", "We select ingredients at their best to preserve texture and flavor."],
        ["Natural Ingredients", "Clean preparation based on balanced recipes without compromising quality."],
        ["25+ Years of Experience", "Long market knowledge and deep understanding of Egyptian taste."],
        ["High Quality", "A modern visual identity with consistent flavor for retail, distribution, and hospitality."],
      ],
      trust: [
        ["Delivery Areas", "Kafr Tohormos, Bulaq El Dakrour, Giza, and Greater Cairo based on request."],
        ["Freshness Promise", "Careful preparation that preserves crunch and natural flavor in every pack."],
        ["For Homes and Restaurants", "Suitable sizes for retail and wholesale with stable quality every time."],
      ],
    },
    gallery: { label: "Gallery", title: "Appetizing visuals that showcase the product clearly" },
    testimonials: {
      label: "Customer Trust",
      title: "A flavor people come back to again and again",
      subtitle: "Quick trust signals that reflect product quality and a polished brand presentation.",
      items: [
        ["Perfect for everyday meals", "Balanced flavor and crisp texture make it a reliable side for home meals and sandwiches."],
        ["Great for restaurants and repeat orders", "Consistent quality and easy WhatsApp ordering with a range that covers the most requested items."],
        ["Modern branding with clear product appeal", "A polished visual presentation helps the brand feel cleaner and more professional to customers."],
      ],
    },
    order: {
      label: "New Order",
      title: "Submit your order and payment preference",
      text: 'Fill in the details below and the admin will review your request. Choosing "Visa" or "Credit Card" here is only a payment preference and not a complete online payment gateway yet.',
      firstName: "First Name",
      lastName: "Last Name",
      thirdName: "Third Name",
      phone: "Phone Number",
      whatsapp: "WhatsApp Number",
      country: "Country",
      governorate: "Governorate",
      paymentMethod: "Payment Method",
      notes: "Notes",
      notesPlaceholder: "Optional order notes",
      submit: "Submit Order",
      paymentOptions: {
        cod: "Cash on Delivery",
        visa: "Visa",
        card: "Credit Card",
      },
      success: "Order submitted successfully. The admin can review it now.",
      failure: "Failed to submit order.",
    },
    contact: {
      label: "Contact Us",
      title: "The fastest way to order is through WhatsApp",
      text: "For inquiries and retail or wholesale requests, contact us directly on WhatsApp and we will reply as quickly as possible.",
      whatsappLabel: "Message us on WhatsApp",
      mapLabel: "Show on Map",
      footerWhatsappLabel: "Order via WhatsApp",
      footerMapLabel: "View Location",
    },
    mobileCta: { call: "Call", whatsapp: "WhatsApp", map: "Map" },
    countries: {
      Egypt: { label: "Egypt", governorates: ["Cairo", "Giza", "Alexandria", "Dakahlia", "Sharqia", "Qalyubia"] },
      "Saudi Arabia": { label: "Saudi Arabia", governorates: ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam"] },
      UAE: { label: "UAE", governorates: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"] },
      Kuwait: { label: "Kuwait", governorates: ["Al Asimah", "Hawalli", "Farwaniya", "Ahmadi"] },
      Qatar: { label: "Qatar", governorates: ["Doha", "Al Rayyan", "Al Wakrah", "Umm Salal"] },
    },
  },
};

function byId(id) {
  return document.getElementById(id);
}

function t() {
  return translations[currentLanguage];
}

function getResolvedTheme() {
  if (currentTheme === "system") {
    return systemThemeQuery?.matches ? "dark" : "light";
  }

  return currentTheme;
}

function applyLanguageDirection() {
  const isArabic = currentLanguage === "ar";
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.body.classList.toggle("is-ltr", !isArabic);
  document.title = t().metaTitle;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", t().metaDescription);
  }
  if (langToggle) {
    langToggle.textContent = t().nav.toggle;
  }
  if (themeToggle) {
    themeToggle.textContent =
      getResolvedTheme() === "dark" ? t().nav.themeLight : t().nav.themeDark;
  }
}

function applyTheme() {
  document.body.classList.toggle("theme-dark", getResolvedTheme() === "dark");
  if (themeToggle) {
    themeToggle.textContent =
      getResolvedTheme() === "dark" ? t().nav.themeLight : t().nav.themeDark;
  }
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
  setText("nav-brand-name", t().hero.title);
  setText("nav-brand-tagline", t().hero.tagline);
  setText("hero-eyebrow", t().hero.eyebrow);
  setText("hero-title", t().hero.title);
  setText("hero-tagline", t().hero.tagline);
  setText("hero-text", t().hero.text);
  setText("nav-order-label", t().hero.primaryCta);
  setText("hero-primary-label", t().hero.primaryCta);
  setText("hero-secondary-label", t().hero.secondaryCta);
  setText("floating-whatsapp-label", t().floatingWhatsapp);
  setText("nav-about-label", t().nav.about);
  setText("nav-products-label", t().nav.products);
  setText("nav-why-label", t().nav.why);
  setText("nav-gallery-label", t().nav.gallery);
  setText("nav-order-section-label", t().nav.order);
  setText("nav-contact-label", t().nav.contact);

  setImage("brand-logo", content.brand.logo, `شعار ${content.brand.name}`);
  setImage("footer-logo", content.brand.logo, `شعار ${content.brand.name}`);
  setImage("hero-image", content.hero.image, content.hero.title);

  const trustStrip = byId("hero-trust-strip");
  if (trustStrip) {
    trustStrip.innerHTML = t().hero.trust
      .map((item) => `<span>${item}</span>`)
      .join("");
  }

  const metrics = byId("hero-metrics");
  if (metrics) {
    metrics.innerHTML = t().hero.metrics
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
  setText("about-label", t().about.label);
  setText("about-title", t().about.title);
  setText("about-text-1", t().about.text1);
  setText("about-text-2", t().about.text2);
  setText("about-experience-value", t().about.experienceValue);
  setText("about-experience-title", t().about.experienceTitle);
  setText("about-experience-text", t().about.experienceText);
  setImage("about-image", content.about.image, content.about.title);
}

function renderProducts() {
  setText("products-label", t().products.label);
  setText("products-title", t().products.title);
  setText("products-subtitle", t().products.subtitle);

  const grid = byId("products-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = content.products.items
    .map((item, index) => {
      const localized = t().products.items[index];
      const orderUrl = contentManager.buildWhatsAppUrl(
        content.contact.whatsappWaNumber,
        currentLanguage === "ar"
          ? `مرحباً، أريد طلب صنف ${localized[0]} من ${t().hero.title}.`
          : `Hello, I would like to order ${localized[0]} from ${t().hero.title}.`
      );

      return `
        <article
          class="product-card reveal"
          data-product-name="${localized[0]}"
          data-product-description="${localized[2]}"
          data-product-image="${item.image}"
        >
          <img src="${item.image}" alt="${localized[0]}" loading="lazy" decoding="async" />
          <div class="product-card-body">
            <h3>${localized[0]}</h3>
            <p>${localized[1]}</p>
            <div class="product-actions">
              <button class="button product-modal-trigger" type="button">${t().products.detailsLabel}</button>
              <a class="product-link" href="${orderUrl}" target="_blank" rel="noopener noreferrer">${t().products.orderLabel}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWhyUs() {
  setText("why-label", t().whyUs.label);
  setText("why-title", t().whyUs.title);

  const featuresGrid = byId("features-grid");
  if (featuresGrid) {
    featuresGrid.innerHTML = t().whyUs.features
      .map(
        (item) => `
          <article class="feature-card reveal">
            <h3>${item[0]}</h3>
            <p>${item[1]}</p>
          </article>
        `
      )
      .join("");
  }

  const trustBand = byId("trust-band");
  if (trustBand) {
    trustBand.innerHTML = t().whyUs.trust
      .map(
        (item) => `
          <div class="trust-item">
            <strong>${item[0]}</strong>
            <span>${item[1]}</span>
          </div>
        `
      )
      .join("");
  }
}

function renderGallery() {
  setText("gallery-label", t().gallery.label);
  setText("gallery-title", t().gallery.title);

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
  setText("testimonials-label", t().testimonials.label);
  setText("testimonials-title", t().testimonials.title);
  setText("testimonials-subtitle", t().testimonials.subtitle);

  const grid = byId("testimonials-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = t().testimonials.items
    .map(
      (item) => `
        <article class="testimonial-card reveal">
          <strong>${item[0]}</strong>
          <p>${item[1]}</p>
        </article>
      `
    )
    .join("");
}

function renderContact() {
  setText("contact-label", t().contact.label);
  setText("contact-title", t().contact.title);
  setText("contact-text", t().contact.text);
  setText("contact-whatsapp-label", t().contact.whatsappLabel);
  setText("contact-whatsapp-display", content.contact.whatsappDisplay);
  setText("contact-phone-display", content.contact.phoneDisplay);
  setText("contact-map-label", t().contact.mapLabel);
  setText("footer-brand-name", t().hero.title);
  setText("footer-summary", content.brand.footerSummary);
  setText("footer-phone-display", content.contact.phoneDisplay);
  setText("footer-whatsapp-label", t().contact.footerWhatsappLabel);
  setText("footer-map-label", t().contact.footerMapLabel);
  setText("mobile-call-link", t().mobileCta.call);
  setText("mobile-whatsapp-link", t().mobileCta.whatsapp);
  setText("mobile-map-link", t().mobileCta.map);

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
  applyLanguageDirection();
  renderHero();
  renderAbout();
  renderProducts();
  renderWhyUs();
  renderGallery();
  renderTestimonials();
  renderContact();
  renderOrderSection();
}

function renderOrderSection() {
  setText("order-label", t().order.label);
  setText("order-title", t().order.title);
  setText("order-text", t().order.text);
  setText("order-first-name-label", t().order.firstName);
  setText("order-last-name-label", t().order.lastName);
  setText("order-third-name-label", t().order.thirdName);
  setText("order-phone-label", t().order.phone);
  setText("order-whatsapp-label", t().order.whatsapp);
  setText("order-country-label", t().order.country);
  setText("order-governorate-label", t().order.governorate);
  setText("order-payment-method-label", t().order.paymentMethod);
  setText("order-notes-label", t().order.notes);
  setText("order-submit-label", t().order.submit);
  setText("payment-cod-option", t().order.paymentOptions.cod);
  setText("payment-visa-option", t().order.paymentOptions.visa);
  setText("payment-card-option", t().order.paymentOptions.card);
  const notes = byId("order-notes");
  if (notes) {
    notes.placeholder = t().order.notesPlaceholder;
  }
}

function populateCountries() {
  if (!orderCountry || !orderGovernorate) {
    return;
  }

  orderCountry.innerHTML = Object.entries(t().countries)
    .map(([country, config]) => `<option value="${country}">${config.label}</option>`)
    .join("");

  populateGovernorates(orderCountry.value);
}

function populateGovernorates(country) {
  if (!orderGovernorate) {
    return;
  }

  const governorates = t().countries[country]?.governorates || [];
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
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const revealItems = document.querySelectorAll(".reveal");
  revealObserver = new IntersectionObserver(
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

  revealItems.forEach((item) => revealObserver.observe(item));
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
    if (trigger.dataset.bound === "true") {
      return;
    }
    trigger.dataset.bound = "true";
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
        currentLanguage === "ar"
          ? `مرحباً، أريد طلب صنف ${name} من ${t().hero.title}.`
          : `Hello, I would like to order ${name} from ${t().hero.title}.`
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

    if (button?.dataset.bound === "true") {
      return;
    }
    if (button) {
      button.dataset.bound = "true";
    }

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
      orderStatus.textContent = t().order.success;
      orderStatus.removeAttribute("hidden");
    } catch (error) {
      orderStatus.textContent = error.message || t().order.failure;
      orderStatus.removeAttribute("hidden");
    }
  });
}

function setupLanguageToggle() {
  langToggle?.addEventListener("click", () => {
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    window.localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    applyContent();
    populateCountries();
    setupRevealAnimations();
    setupProductModal();
    setupGalleryLightbox();
  });
}

function setupThemeToggle() {
  applyTheme();

  themeToggle?.addEventListener("click", () => {
    currentTheme = getResolvedTheme() === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme();
  });

  if (!systemThemeQuery) {
    return;
  }

  systemThemeQuery.addEventListener("change", () => {
    if (currentTheme !== "system") {
      return;
    }

    applyTheme();
  });
}

async function init() {
  content = await contentManager.loadContent();
  applyContent();
  applyTheme();
  setupRevealAnimations();
  setupSectionHighlighting();
  setupNavigation();
  setupProductModal();
  setupGalleryLightbox();
  setupCloseActions();
  setupOrderForm();
  setupLanguageToggle();
  setupThemeToggle();
}

init();
