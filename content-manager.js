(function () {
  const STORAGE_KEY = "alhelwany-site-content-v1";

  const defaultContent = {
    brand: {
      name: "مخللات الحلواني",
      tagline: "طبيعي.. صحي.. طازج",
      logo: "assets/images/logo.jpg",
      footerSummary:
        "مخللات مصرية طبيعية بطابع عصري وجودة ثابتة منذ أكثر من 25 عاماً.",
    },
    hero: {
      eyebrow: "نكهة مصرية أصيلة بلمسة عصرية",
      title: "مخللات الحلواني",
      tagline: "طبيعي.. صحي.. طازج",
      text:
        "تشكيلة فاخرة من الزيتون والخيار واللفت والجزر والبصل والمشكل، مصنوعة من مكونات طبيعية وطازجة بخبرة تتجاوز 25 عاماً.",
      primaryCta: "اطلب الآن",
      secondaryCta: "اكتشف المنتجات",
      image: "assets/images/photo_23_2026-03-24_18-45-33.jpg",
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
      image: "assets/images/photo_18_2026-03-24_18-45-33.jpg",
    },
    products: {
      label: "منتجاتنا",
      title: "تشكيلة مختارة بعناية",
      subtitle: "كل صنف مصمم ليقدّم توازن مثالي بين الطعم، القرمشة، والانتعاش.",
      orderLabel: "اطلب الصنف",
      detailsLabel: "عرض التفاصيل",
      items: [
        {
          name: "زيتون",
          description: "زيتون مختار بعناية بطعم متوازن ولمسة ملحية مدروسة.",
          modalDescription:
            "زيتون مختار بعناية بطعم متوازن ولمسة ملحية مدروسة. مناسب للتقديم اليومي والمطاعم.",
          image: "assets/images/photo_12_2026-03-24_18-45-33.jpg",
        },
        {
          name: "خيار مخلل",
          description: "حبات مقرمشة بطزاجة واضحة ونكهة مصرية أصلية.",
          modalDescription:
            "حبات خيار مقرمشة بطزاجة واضحة ونكهة مصرية أصلية. مثالي مع السندوتشات والأطباق الشعبية.",
          image: "assets/images/photo_3_2026-03-24_18-45-33.jpg",
        },
        {
          name: "لفت",
          description: "لون مميز وقوام متماسك مع طعم خفيف ومنعش.",
          modalDescription:
            "لفت بلونه المميز وقوامه المتماسك مع طعم خفيف ومنعش يكمّل السفرة المصرية.",
          image: "assets/images/photo_15_2026-03-24_18-45-33.jpg",
        },
        {
          name: "جزر",
          description: "شرائح جزر طازجة تضيف قرمشة محببة ولمسة مشرقة للمائدة.",
          modalDescription:
            "شرائح جزر طازجة تضيف قرمشة محببة ولمسة مشرقة للمائدة مع توازن ممتاز في الطعم.",
          image: "assets/images/photo_10_2026-03-24_18-45-33.jpg",
        },
        {
          name: "بصل مخلل",
          description: "بصل صغير بنكهة متوازنة مثالي للتقديم مع الأطباق الشعبية.",
          modalDescription:
            "بصل صغير بنكهة متوازنة مثالي للتقديم مع الأطباق الشعبية والمشويات والوجبات السريعة.",
          image: "assets/images/photo_19_2026-03-24_18-45-33.jpg",
        },
        {
          name: "مشكل",
          description: "مزيج غني من أكثر الأصناف طلباً في برطمان واحد فاخر.",
          modalDescription:
            "مزيج غني من أكثر الأصناف طلباً في برطمان واحد فاخر، مناسب للعائلة والضيافة.",
          image: "assets/images/photo_2_2026-03-24_18-48-17.jpg",
        },
      ],
    },
    whyUs: {
      label: "لماذا نحن",
      title: "جودة واضحة من أول نظرة وأول طعم",
      features: [
        {
          title: "منتجات طازجة",
          text: "نختار المكونات في أفضل حالاتها لنحافظ على القوام والنكهة.",
        },
        {
          title: "مكونات طبيعية",
          text: "تحضير نظيف يعتمد على وصفات متوازنة دون التنازل عن الجودة.",
        },
        {
          title: "25+ سنة خبرة",
          text: "معرفة طويلة بالسوق والذوق المصري في أدق تفاصيل المنتج.",
        },
        {
          title: "جودة عالية",
          text: "هوية بصرية حديثة وطعم ثابت يناسب البيع والتوزيع والضيافة.",
        },
      ],
      trust: [
        {
          title: "مناطق التوصيل",
          text: "كفر طهرمس، بولاق الدكرور، الجيزة، والقاهرة الكبرى حسب الطلب.",
        },
        {
          title: "وعد الطزاجة",
          text: "تحضير دقيق للحفاظ على القرمشة والنكهة الطبيعية في كل عبوة.",
        },
        {
          title: "للمنازل والمطاعم",
          text: "أحجام مناسبة للتجزئة والجملة مع جودة ثابتة في كل مرة.",
        },
      ],
    },
    gallery: {
      label: "المعرض",
      title: "هوية شهية وصور تبرز المنتج كما هو",
      items: [
        {
          image: "assets/images/photo_18_2026-03-24_18-45-33.jpg",
          alt: "جلسة تقديم مخللات",
        },
        {
          image: "assets/images/photo_21_2026-03-24_18-45-33.jpg",
          alt: "خيار مخلل",
        },
        {
          image: "assets/images/photo_22_2026-03-24_18-45-33.jpg",
          alt: "منتج ليمون معصفر",
        },
        {
          image: "assets/images/photo_4_2026-03-24_18-45-33.jpg",
          alt: "زيتون محشي",
        },
        {
          image: "assets/images/photo_9_2026-03-24_18-45-33.jpg",
          alt: "مكدوس",
        },
        {
          image: "assets/images/photo_13_2026-03-24_18-45-33.jpg",
          alt: "هريسة شطة",
        },
      ],
    },
    testimonials: {
      label: "ثقة العملاء",
      title: "الطعم الذي يرجع له الناس مرة بعد مرة",
      subtitle:
        "مؤشرات ثقة سريعة تعكس طريقة تقديم العلامة وجودة المنتج في الاستخدام اليومي.",
      items: [
        {
          title: "مناسب للسفرة اليومية",
          text: "طعم متوازن وقرمشة واضحة تجعله اختياراً ثابتاً بجانب الوجبات المنزلية والسندوتشات.",
        },
        {
          title: "ملائم للمطاعم والطلبات المتكررة",
          text: "ثبات في الجودة وسهولة في الطلب عبر واتساب، مع تشكيلة تغطي الأصناف الأكثر طلباً.",
        },
        {
          title: "هوية حديثة ومنتج واضح",
          text: "التقديم البصري العصري يساعد العلامة على الظهور بشكل أنظف وأكثر احترافية أمام العملاء.",
        },
      ],
    },
    contact: {
      label: "تواصل معنا",
      title: "الطلب الأسرع عبر واتساب",
      text:
        "للحجز والاستفسار وطلبات الجملة أو التجزئة، تواصل مباشرة عبر واتساب وسنرد عليك بأسرع وقت.",
      whatsappDisplay: "01061162947",
      phoneDisplay: "01061162947",
      whatsappWaNumber: "201061162947",
      whatsappLabel: "راسلنا على واتساب",
      footerWhatsappLabel: "اطلب عبر واتساب",
      mapLabel: "عرض على الخريطة",
      footerMapLabel: "عرض الموقع",
      addressLines: [
        "256G+CF8",
        "طريق كفر طهرمس",
        "كفر طهرمس / ب، بولاق الدكرور",
        "محافظة الجيزة 3710501",
      ],
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=256G%2BCF8%D8%8C%20%D8%B7%D8%B1%D9%8A%D9%82%20%D9%83%D9%81%D8%B1%20%D8%B7%D9%87%D8%B1%D9%85%D8%B3%D8%8C%20%D9%83%D9%81%D8%B1%20%D8%B7%D9%87%D8%B1%D9%85%D8%B3%20%2F%20%D8%A8%D8%8C%20%D8%A8%D9%88%D9%84%D8%A7%D9%82%20%D8%A7%D9%84%D8%AF%D9%83%D8%B1%D9%88%D8%B1%D8%8C%20%D9%85%D8%AD%D8%A7%D9%81%D8%B8%D8%A9%20%D8%A7%D9%84%D8%AC%D9%8A%D8%B2%D8%A9%203710501",
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveLocal(content) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  }

  function getLocal() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(defaultContent);
    }

    try {
      return JSON.parse(raw);
    } catch (_error) {
      return clone(defaultContent);
    }
  }

  async function loadContent() {
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load content");
      }
      const data = await response.json();
      saveLocal(data);
      return data;
    } catch (_error) {
      return getLocal();
    }
  }

  async function saveContent(content) {
    const response = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      let message = "Failed to save content";
      try {
        const errorPayload = await response.json();
        message = errorPayload.error || message;
      } catch (_error) {
        // Ignore parse failure and use fallback message.
      }
      throw new Error(message);
    }

    saveLocal(content);
    return content;
  }

  async function resetContent() {
    const response = await fetch("/api/content/reset", { method: "POST" });
    if (!response.ok) {
      let message = "Failed to reset content";
      try {
        const errorPayload = await response.json();
        message = errorPayload.error || message;
      } catch (_error) {
        // Ignore parse failure and use fallback message.
      }
      throw new Error(message);
    }

    const data = await response.json();
    saveLocal(data);
    return data;
  }

  function exportContent(content) {
    return JSON.stringify(content || getLocal(), null, 2);
  }

  async function importContent(jsonText) {
    const parsed = JSON.parse(jsonText);
    await saveContent(parsed);
    return parsed;
  }

  function buildWhatsAppUrl(waNumber, message) {
    const encoded = encodeURIComponent(message || "");
    return `https://wa.me/${waNumber}${encoded ? `?text=${encoded}` : ""}`;
  }

  window.SiteContentManager = {
    STORAGE_KEY,
    defaultContent: clone(defaultContent),
    loadContent,
    saveContent,
    resetContent,
    exportContent,
    importContent,
    buildWhatsAppUrl,
  };
})();
