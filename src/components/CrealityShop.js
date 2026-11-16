import confetti from 'canvas-confetti';

export class CrealityShop {
  constructor(mountElement, options = {}) {
    this.mount = typeof mountElement === 'string' ? document.querySelector(mountElement) : mountElement;
    this.currency = options.currency || 'UZS';
    this.isAdmin = this.checkAdminAuth();
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.products = [];
    this.activeProductForEdit = null;
    this.activeProductForOrder = null;
    this.onViewChange = options.onViewChange || null;

    this.init();
  }

  checkAdminAuth() {
    const sessionAuth = sessionStorage.getItem('any3d_admin_auth');
    if (sessionAuth === '083010' || sessionAuth === 'any3DCubicc') {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin') || params.get('admin');
    if (pin === '083010' || pin === 'any3dcubicc') {
      sessionStorage.setItem('any3d_admin_auth', '083010');
      return true;
    }
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser && (tgUser.id === 8929216064 || (tgUser.username || '').toLowerCase() === 'any3dcubicc')) {
      sessionStorage.setItem('any3d_admin_auth', '083010');
      return true;
    }
    return false;
  }

  setCurrency(curr) {
    this.currency = curr;
    this.render();
  }

  formatPrice(uzs, usd) {
    if (this.currency === 'USD') {
      const val = usd || Math.round(uzs / 12700);
      return `$${Number(val).toLocaleString('en-US')}`;
    }
    return `${Number(uzs).toLocaleString('uz-UZ').replace(/,/g, ' ')} so‘m`;
  }

  async init() {
    await this.fetchProducts();
    this.render();
  }

  async fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.products) && data.products.length > 0) {
          this.products = data.products;
          localStorage.setItem('cached_models_v2', JSON.stringify(this.products));
          return;
        }
      }
    } catch (e) {
      console.warn('API orqali modellarni olishda ogohlantirish, keshdan tekshirilmoqda...');
    }

    // LocalStorage fallback
    try {
      const cached = JSON.parse(localStorage.getItem('cached_models_v2') || '[]');
      if (cached.length > 0) {
        this.products = cached;
        return;
      }
    } catch (e) {}

    // Agar kesh bo'sh bo'lsa default Creality modellari
    this.products = this.getDefaultModels();
    localStorage.setItem('cached_models_v2', JSON.stringify(this.products));
  }

  getDefaultModels() {
    return [
      {
        id: "model-crystal-dragon",
        category: "articulated",
        categoryTitle: "Bo‘g‘inli & Flexi",
        name: "Crystal Dragon (Print-in-Place)",
        subtitle: "Bo‘g‘inli harakatlanuvchi billur ajdaho (Yig‘ish talab etilmaydi)",
        priceUZS: 75000,
        priceUSD: 6,
        oldPriceUZS: 95000,
        badge: "🔥 Dunyo Bo‘yicha #1 Trend",
        icon: "🐉",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/popular",
        inStock: true,
        stockStatus: "Ustaxonada tayyor (Chilonzor)",
        specs: [
          "Texnologiya: Print-in-Place (Stoldan to‘liq harakatlanuvchi chiqadi)",
          "Vazni: ~110 gramm | O‘lchami: Uzunligi 45 sm",
          "Tavsiya material: Ipaksimon Silk PLA (Kamalak / Oltin)",
          "Chop etish vaqti: ~5.5 soat (Bambu Lab / Creality K1)"
        ],
        description: "Creality Cloud platformasidagi eng mashhur 3D model. Butun tanasi bo‘g‘inli, qo‘lda o‘ynash uchun mukammal antistress ajdaho."
      },
      {
        id: "model-collapsible-katana",
        category: "articulated",
        categoryTitle: "Bo‘g‘inli & Flexi",
        name: "Teleskopik Yig‘iluvchan Katana Qilichi",
        subtitle: "Siltaganda 90 sm ga ochiluvchi teleskopik qilich",
        priceUZS: 85000,
        priceUSD: 7,
        oldPriceUZS: 110000,
        badge: "⚔️ Viral Trend",
        icon: "🗡️",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/popular",
        inStock: true,
        stockStatus: "Ustaxonada tayyor",
        specs: [
          "Uzunligi: Yig‘ilganda 24 sm, ochilganda 92 sm",
          "Qavatlar soni: 5 bo‘g‘inli teleskopik pichoq",
          "Tavsiya material: Qattiq PETG yoki Hyper PLA",
          "Chop etish vaqti: ~6 soat"
        ],
        description: "Bir siltash bilan ochiluvchi zamonaviy samuray qilichi. Bolalar va kattalar uchun eng qiziqarli interaktiv 3D model."
      },
      {
        id: "model-ironman-bust",
        category: "characters",
        categoryTitle: "Figuralar & Anime",
        name: "Iron Man Mark 85 Kolleksion Büst",
        subtitle: "Ichki yoritgich (LED) o‘rnatish imkoni bilan",
        priceUZS: 140000,
        priceUSD: 11,
        oldPriceUZS: 180000,
        badge: "🦸 Marvel Original",
        icon: "🤖",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/character",
        inStock: true,
        stockStatus: "Tayyorlanish: 24 soat",
        specs: [
          "Balandligi: 18 sm | Og‘irligi: ~180 gramm",
          "Detalizatsiya: 0.12 mm Ultra-aniq qatlam",
          "Ichki ko‘z qismlari shaffof PETG (LED o‘rnatishga mos)"
        ],
        description: "Marvel koinotining eng sevimli qahramoni b银sti. Ish stoli, javon va sovg‘a uchun juda nufuzli ko‘rinishga ega."
      },
      {
        id: "model-cyberpunk-samurai",
        category: "characters",
        categoryTitle: "Figuralar & Anime",
        name: "Kiberpank Mecha Samuray Haykali",
        subtitle: "Futuristik qurollangan robot-jangchi haykalchasi",
        priceUZS: 125000,
        priceUSD: 10,
        oldPriceUZS: 160000,
        badge: "⚡ Kiber Dizayn",
        icon: "🦾",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/character",
        inStock: true,
        stockStatus: "Tayyorlanish: 24 soat",
        specs: [
          "Balandligi: 16 sm | Vazni: ~140 gramm",
          "Modulli yig‘ish: Qilich va orqa qanotlar ajraladi",
          "Material: Mat qora PLA Pro + Neonn ranglar"
        ],
        description: "Kiberpank uslubidagi robot-samuray. Kompyuter stoli va geymerlar xonasi uchun ajoyib aksessuar."
      },
      {
        id: "model-planetary-gearbox",
        category: "mechanical",
        categoryTitle: "Muhandislik & Avto",
        name: "Planetar Reduktor & Tishli Uzatma",
        subtitle: "Aylanuvchi sun'iy yo‘ldosh shesternalar mexanizmi",
        priceUZS: 65000,
        priceUSD: 5,
        oldPriceUZS: 85000,
        badge: "⚙️ Muhandislik",
        icon: "⚙️",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/tools",
        inStock: true,
        stockStatus: "Ustaxonada tayyor",
        specs: [
          "Reduksiya koeffitsienti: 4:1 nisbat",
          "Mexanik podshipniklar va shesternalar 100% 3D bosilgan",
          "Tavsiya material: Ishqalanishga chidamli PETG / ABS"
        ],
        description: "Avtomobil va stanoklardagi tishli uzatmalar qanday ishlashini amalda ko‘rsatuvchi ajoyib mexanik model."
      },
      {
        id: "model-fpv-drone-frame",
        category: "mechanical",
        categoryTitle: "Muhandislik & Avto",
        name: "5 Dyuymli FPV Dron Romi & Korpus",
        subtitle: "Yengil va zarbaga o‘ta chidamli aerodinamik karkas",
        priceUZS: 95000,
        priceUSD: 7.5,
        oldPriceUZS: 130000,
        badge: "🚁 Dronlar",
        icon: "🛸",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/tools",
        inStock: true,
        stockStatus: "Tayyorlanish: 24 soat",
        specs: [
          "Og‘irligi: atigi 68 gramm (Ultra-yengil)",
          "Motor o‘rnatish: 16×16 mm va 19×19 mm standartlar",
          "Tavsiya material: PETG-Carbon yoki qattiq Karbon tola"
        ],
        description: "Dron ixlosmandlari uchun zarbaga bardoshli maxsus konstruksiya. Yiqilganda sinmaydigan elastik komponentlar bilan."
      },
      {
        id: "model-voronoi-moon-lamp",
        category: "decor",
        categoryTitle: "Uy Bezagi & Lampalar",
        name: "Oy Shaklidagi Tungi Lampa (3D Moon Lamp)",
        subtitle: "Oy kraterlari aniq relyefi va yog‘och taglik stendi bilan",
        priceUZS: 110000,
        priceUSD: 9,
        oldPriceUZS: 145000,
        badge: "🌕 Top Sovg‘a",
        icon: "🏮",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/hobby",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "Diametri: 15 sm | Vazni: ~130 gramm",
          "NASA sun'iy yo‘ldosh topografik xaritasi asosida chizilgan",
          "Ichiga LED lampochka yoki telefon chirog‘i tushadi"
        ],
        description: "Kechasi xonada yoqilganda xuddi haqiqiy to‘lin oydek mayin nur sochadi. Yaqinlar uchun eng nafis sovg‘a."
      },
      {
        id: "model-controller-stand",
        category: "decor",
        categoryTitle: "Uy Bezagi & Lampalar",
        name: "PlayStation / Xbox Geympad va Naushnik Stendi",
        subtitle: "Kibersport va stolda tartib o‘rnatuvchi universal taglik",
        priceUZS: 70000,
        priceUSD: 5.5,
        oldPriceUZS: 90000,
        badge: "🎮 Geymerlar Uchun",
        icon: "🎧",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/hobby",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "Sig‘imi: 2 ta joystik (PS5 / Xbox) + 1 ta katta naushnik",
          "Pastki qismida og‘irlik markazi va sirpanmas taglik",
          "Material: Qattiq PETG Pro"
        ],
        description: "Geympad va naushniklaringiz stol ustida sochilib yotmaydi. Tartibli va zamonaviy ko‘rinish bag‘ishlaydi."
      },
      {
        id: "model-tashkent-tv-tower",
        category: "architecture",
        categoryTitle: "Arxitektura Maketlari",
        name: "Toshkent Teleminorasi Arxitektura Maketi",
        subtitle: "375 metrli mashhur teleminoraning 1:1000 masshtabdagi nusxasi",
        priceUZS: 95000,
        priceUSD: 7.5,
        oldPriceUZS: 125000,
        badge: "🇺🇿 Toshkent Belgisi",
        icon: "🗼",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/architecture",
        inStock: true,
        stockStatus: "Tayyorlanish: 24 soat",
        specs: [
          "Balandligi: 37.5 sm | Masshtab: 1:1000",
          "Metallik kumush va qizil/oq panjara poydevor",
          "To‘rli konstruksiya to‘liq nozik qatlamda chiqarilgan"
        ],
        description: "Markaziy Osiyodagi eng baland inshootlardan birining aniq arxitekturaviy nusxasi. Poytaxtimiz ramzi."
      },
      {
        id: "model-modern-villa-cad",
        category: "architecture",
        categoryTitle: "Arxitektura Maketlari",
        name: "Zamonaviy Hay-Tek Villa Maketi (Ichki reja bilan)",
        subtitle: "Qavatma-qavat ochiluvchi 3D xonadon interyeri va hovli",
        priceUZS: 160000,
        priceUSD: 13,
        oldPriceUZS: 220000,
        badge: "🏛️ Arxitektor Tanlovi",
        icon: "🏡",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/architecture",
        inStock: true,
        stockStatus: "Tayyorlanish: 24-48 soat",
        specs: [
          "O‘lchamlari: 22 × 18 sm poydevor, 2 qavatli",
          "Tomi va 2-qavati ochilib, ichki mebellar ko‘rinadi",
          "Material: Oq mat arxitektura plastmassasi"
        ],
        description: "Qurilish kompaniyalari, me'morlar va dizaynerlar uchun loyihani mijozga real ko‘rsatish vositasi."
      },
      {
        id: "model-spiral-voronoi-vase",
        category: "decor",
        categoryTitle: "Uy Bezagi & Lampalar",
        name: "Spiral Voronoi Geometrik Gultuvak & Vaza",
        subtitle: "Parametrik dizayndagi zamonaviy guldon",
        priceUZS: 55000,
        priceUSD: 4.5,
        oldPriceUZS: 75000,
        badge: "🌿 Eko Dizayn",
        icon: "🏺",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/hobby",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "Balandligi: 18 sm | Diametri: 11 sm",
          "Vaza rejimida (Vase Mode) bir tekis uzluksiz chiziqda bosiladi",
          "Ranglar: Zumrad yashil, Qora mat, Oltin rang"
        ],
        description: "Matematik Voronoi algoritmlari bilan yaratilgan nafis gultuvak. Xonaga zamonaviy interyer bag‘ishlaydi."
      },
      {
        id: "model-flexi-rex",
        category: "articulated",
        categoryTitle: "Bo‘g‘inli & Flexi",
        name: "Flexi-Rex (Harakatlanuvchi Tiranozavr)",
        subtitle: "Butun tanasi erkin tebranuvchi mashhur dinozavr",
        priceUZS: 35000,
        priceUSD: 3,
        oldPriceUZS: 50000,
        badge: "🦖 Klassik Flexi",
        icon: "🦖",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/popular",
        inStock: true,
        stockStatus: "Ustaxonada tayyor",
        specs: [
          "Uzunligi: 14 sm | Qalinligi: 15 mm",
          "Bosish vaqti: atigi 1.5 soat",
          "Qo‘lda yumshoq tebranadi, tik tura oladi"
        ],
        description: "3D bosma olamining eng qadimiy va eng mashhur ramzi. Stolda turishi va o‘ynash uchun ajoyib qulaylik."
      }
    ];
  }

  getFilteredProducts() {
    return this.products.filter(p => {
      if (this.currentCategory !== 'all' && p.category !== this.currentCategory) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const str = `${p.name} ${p.subtitle || ''} ${p.categoryTitle || ''} ${p.badge || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }

  render() {
    const filtered = this.getFilteredProducts();

    this.mount.innerHTML = `
      <div class="creality-shop-container">
        <!-- Creality Cloud Hero Banner -->
        <div class="shop-hero-banner">
          <div class="shop-hero-glow"></div>
          <div class="shop-hero-content">
            <div class="shop-brand-row">
              <span class="shop-creality-badge">CREALITY CLOUD • TOP 3D MODELLAR</span>
              <div class="shop-admin-indicator">
                ${this.isAdmin ? `
                  <span class="admin-unlocked-badge">👑 Admin Rejimi (PIN: 083010)</span>
                  <button type="button" class="btn-shop-add-prod" id="btn-add-product">➕ Yangi Model Qo‘shish</button>
                ` : `
                  <button type="button" class="btn-shop-admin-login" id="btn-shop-pin-login">
                    🔐 Narxlarni Boshqarish (Admin PIN)
                  </button>
                `}
              </div>
            </div>

            <h1 class="shop-title">Creality Cloud 3D Modellar & STL Katalogi</h1>
            <p class="shop-desc">
              Dunyoga mashhur <b>Creality Cloud</b> (<a href="https://www.crealitycloud.com/ru" target="_blank" class="creality-link">www.crealitycloud.com/ru</a>) platformasidagi eng mashhur 3D modellar, harakatlanuvchi Flexi o‘yinchoqlar, qahramonlar, muhandislik detallari va uy bezaklari. 
              <b>Istalgan modelni tanlang — Chilonzor ustaxonamizda professional 3D printerda sifatli chiqarib beramiz!</b>
            </p>

            <div class="shop-stats-strip">
              <div class="s-stat"><span class="s-val">500+</span><span class="s-lbl">Mashhur Modellar</span></div>
              <div class="s-stat"><span class="s-val">0.12 mm</span><span class="s-lbl">Ultra-Aniq Qatlam</span></div>
              <div class="s-stat"><span class="s-val">24 Soat</span><span class="s-lbl">Tayyor Bo‘lish Vaqti</span></div>
              <div class="s-stat"><span class="s-val">Toshkent</span><span class="s-lbl">Tezkor Yetkazish</span></div>
            </div>
          </div>
        </div>

        <!-- Filterlar va Qidiruv Paneli -->
        <div class="shop-toolbar">
          <div class="shop-categories-pills">
            <button type="button" class="cat-pill ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">
              🌐 Barcha Modellar (${this.products.length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'articulated' ? 'active' : ''}" data-cat="articulated">
              🐉 Bo‘g‘inli & Flexi (${this.products.filter(p => p.category === 'articulated').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'characters' ? 'active' : ''}" data-cat="characters">
              🦸 Figuralar & Anime (${this.products.filter(p => p.category === 'characters').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'mechanical' ? 'active' : ''}" data-cat="mechanical">
              ⚙️ Muhandislik & Avto (${this.products.filter(p => p.category === 'mechanical').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'decor' ? 'active' : ''}" data-cat="decor">
              🏠 Uy Bezagi & Lampalar (${this.products.filter(p => p.category === 'decor').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'architecture' ? 'active' : ''}" data-cat="architecture">
              🏛️ Arxitektura Maketlari (${this.products.filter(p => p.category === 'architecture').length})
            </button>
          </div>

          <div class="shop-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="shop-search-input" placeholder="Model qidirish (Ajdaho, Katana, Iron Man, Reduktor, Lampa...)" value="${this.searchQuery}">
            ${this.searchQuery ? '<button type="button" class="btn-clear-search" id="btn-clear-search">✕</button>' : ''}
          </div>
        </div>

        <!-- Modellar Ro'yxati (Grid) -->
        <div class="shop-products-grid">
          ${filtered.length === 0 ? `
            <div class="shop-empty-state">
              <div class="empty-icon">🔍</div>
              <h3>Model topilmadi</h3>
              <p>Qidiruv so‘rovingizni o‘zgartiring yoki boshqa toifani tanlang.</p>
              <button type="button" class="btn-reset-filters" id="btn-reset-filters">Barcha Modellarni Ko‘rsatish</button>
            </div>
          ` : filtered.map(p => `
            <div class="product-card ${p.category}" data-product-id="${p.id}">
              <div class="product-card-top">
                <span class="product-badge">${p.badge || 'Creality Model'}</span>
                <span class="stock-pill ${p.inStock ? 'in-stock' : 'pre-order'}">
                  ${p.inStock ? '🟢 Ustaxonada tayyor' : '⏱️ 24 Soatda tayyor'}
                </span>
              </div>

              <!-- Model Vizual Qutisi -->
              <div class="product-visual-box">
                <div class="product-icon-frame">${p.icon || '💎'}</div>
                <div class="product-category-tag">${p.categoryTitle || 'Creality 3D'}</div>
              </div>

              <div class="product-info-body">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-subtitle">${p.subtitle || ''}</p>

                <!-- Texnik xususiyatlar ro'yxati -->
                <ul class="product-specs-list">
                  ${(p.specs || []).slice(0, 3).map(s => `<li>• ${s}</li>`).join('')}
                </ul>

                <!-- Narxlar Maydoni -->
                <div class="product-pricing-box">
                  <div class="price-main">
                    <span class="price-val">${this.formatPrice(p.priceUZS, p.priceUSD)}</span>
                    ${p.oldPriceUZS ? `<span class="price-old">${this.formatPrice(p.oldPriceUZS, Math.round(p.oldPriceUZS / 12700))}</span>` : ''}
                  </div>
                  <span class="stock-status-text">🖨️ ${p.stockStatus || '3D chop etish narxi'}</span>
                </div>

                <!-- Harakat Tugmalari -->
                <div class="product-card-actions">
                  <button type="button" class="btn-order-product" data-order-id="${p.id}">
                    🖨️ Chop Etishga Buyurtma
                  </button>
                  <a href="${p.crealityUrl || 'https://www.crealitycloud.com/ru'}" target="_blank" class="btn-view-creality" title="Creality Cloud original sahifasi">
                    🌐 Creality Cloud
                  </a>
                </div>

                ${this.isAdmin ? `
                  <div class="admin-card-controls">
                    <button type="button" class="btn-admin-edit-price" data-edit-id="${p.id}">
                      ✏️ Narxni O‘zgartirish (Admin)
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 🔒 ADMIN NARXNI O'ZGARTIRISH MODALI -->
        <div class="shop-modal-backdrop" id="price-edit-modal" style="display: none;">
          <div class="shop-modal-card">
            <div class="shop-modal-header">
              <div class="s-modal-title">
                <span class="s-m-icon">✏️</span>
                <div>
                  <h3 id="edit-prod-title">Model Narxini Tahrirlash</h3>
                  <small id="edit-prod-sub">Faqat bosh administrator uchun (PIN: 083010)</small>
                </div>
              </div>
              <button type="button" class="shop-modal-close" id="btn-close-edit">✕</button>
            </div>

            <form class="edit-price-form" id="edit-price-form" onsubmit="return false;">
              <input type="hidden" id="edit-prod-id" value="">
              
              <div class="form-field">
                <label>Model Nomi:</label>
                <input type="text" id="edit-input-name" required>
              </div>

              <div class="form-row-dual">
                <div class="form-field">
                  <label>Chop Etish Narxi (SO‘M da) *</label>
                  <input type="number" id="edit-input-uzs" placeholder="75000" required>
                </div>
                <div class="form-field">
                  <label>Narxi (USD da) *</label>
                  <input type="number" id="edit-input-usd" placeholder="6" required>
                </div>
              </div>

              <div class="form-row-dual">
                <div class="form-field">
                  <label>Maxsus Nishon (Badge):</label>
                  <input type="text" id="edit-input-badge" placeholder="🔥 #1 Trend">
                </div>
                <div class="form-field">
                  <label>Holati:</label>
                  <select id="edit-select-stock">
                    <option value="true">🟢 Ustaxonada tayyor</option>
                    <option value="false">⏱️ 24 Soatda tayyor</option>
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label>Holat Matni:</label>
                <input type="text" id="edit-input-stock-status" placeholder="Ustaxonada tayyor (Chilonzor)">
              </div>

              <div class="shop-modal-actions">
                <button type="submit" class="btn-save-price" id="btn-save-price">
                  💾 Yangi Narxni Saqlash
                </button>
                <button type="button" class="btn-cancel-edit" id="btn-cancel-edit">
                  Bekor Qilish
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 🛒 CHOP ETISHGA BUYURTMA BERISH MODALI -->
        <div class="shop-modal-backdrop" id="shop-order-modal" style="display: none;">
          <div class="shop-modal-card">
            <div class="shop-modal-header">
              <div class="s-modal-title">
                <span class="s-m-icon">🖨️</span>
                <div>
                  <h3 id="order-modal-prod-name">Modelni Chop Etishga Buyurtma</h3>
                  <small id="order-modal-prod-price">Toshkent 3D Ustaxonasi (Chilonzor)</small>
                </div>
              </div>
              <button type="button" class="shop-modal-close" id="btn-close-order">✕</button>
            </div>

            <form class="shop-order-form" id="shop-order-form" onsubmit="return false;">
              <input type="hidden" id="order-hidden-prod-id" value="">
              
              <div class="form-row-dual">
                <div class="form-field">
                  <label>Ism va Familiyangiz *</label>
                  <input type="text" id="shop-cust-name" placeholder="Ismingizni kiriting" required>
                </div>
                <div class="form-field">
                  <label>Telefon Raqamingiz *</label>
                  <input type="tel" id="shop-cust-phone" placeholder="+998 90 123 45 67" required>
                </div>
              </div>

              <div class="form-row-dual">
                <div class="form-field">
                  <label>Telegram Username (Ixtiyoriy):</label>
                  <input type="text" id="shop-cust-tg" placeholder="@username">
                </div>
                <div class="form-field">
                  <label>Yetkazib Berish Manzili:</label>
                  <input type="text" id="shop-cust-addr" placeholder="Chilonzor yoki Toshkent bo‘yicha">
                </div>
              </div>

              <div class="form-field">
                <label>Rang yoki Qayta Ishlash Istagi (Ixtiyoriy):</label>
                <textarea id="shop-cust-notes" rows="2" placeholder="Masalan: Ipaksimon oltin rangda yoki qora mat PLA da chiqarib bering"></textarea>
              </div>

              <div class="order-summary-box">
                <div class="o-sum-row">
                  <span>Tanlangan Model:</span>
                  <strong id="summary-prod-name">-</strong>
                </div>
                <div class="o-sum-row total">
                  <span>Chop Etish To‘lovi:</span>
                  <strong id="summary-prod-price" style="color: #00d26a;">-</strong>
                </div>
              </div>

              <div class="shop-modal-actions">
                <button type="submit" class="btn-submit-shop-order" id="btn-submit-shop-order">
                  🚀 Chop Etishga Tasdiqlash
                </button>
                <button type="button" class="btn-cancel-edit" id="btn-cancel-shop-order">
                  Bekor Qilish
                </button>
              </div>
            </form>

            <div class="shop-order-success" id="shop-order-success" style="display: none;">
              <div class="s-succ-icon">🎉</div>
              <h3>Buyurtmangiz Qabul Qilindi!</h3>
              <p id="shop-succ-num" class="succ-order-code">#SHOP-5452</p>
              <p class="succ-desc">
                Model Toshkent 3D Ustaxonasi navbatiga qo‘yildi va bosh administratorga (<b>@any3DCubicc</b>) yetkazildi. Tez orada dastgohda chop etish boshlanadi!
              </p>
              <div class="succ-btns">
                <a href="https://t.me/Any3dCubic_bot" target="_blank" class="btn-succ-bot">
                  🤖 Botda Holatni Ko‘rish (@Any3dCubic_bot)
                </a>
                <button type="button" class="btn-succ-close" id="btn-succ-close">
                  Modellar Katalogiga Qaytish
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 🔐 ADMIN PIN MODAL -->
        <div class="shop-modal-backdrop" id="shop-pin-modal" style="display: none;">
          <div class="shop-modal-card pin-card">
            <div class="pin-badge">👑 NARX BOSHQARUVI</div>
            <h3>Admin PIN Kodini Kiriting</h3>
            <p>Model narxlarini tahrirlash huquqi faqat maxfiy PIN kodga ega bosh administratorga berilgan.</p>
            
            <form class="shop-pin-form" id="shop-pin-form" onsubmit="return false;">
              <input type="password" id="shop-pin-input" placeholder="6 xonali PIN" maxlength="10" autofocus>
              <div class="pin-error" id="shop-pin-error" style="display: none;">
                🚫 Noto‘g‘ri PIN kod!
              </div>
              <div class="pin-actions">
                <button type="submit" class="btn-submit-pin">🔓 Kirish</button>
                <button type="button" class="btn-cancel-pin" id="btn-cancel-shop-pin">Bekor Qilish</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // 1. Kategoriyalarni almashtirish
    const catPills = this.mount.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.currentCategory = pill.getAttribute('data-cat') || 'all';
        this.render();
      });
    });

    // 2. Qidiruv inputi
    const searchInput = this.mount.querySelector('#shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const freshInput = this.mount.querySelector('#shop-search-input');
        if (freshInput) {
          freshInput.focus();
          freshInput.selectionStart = freshInput.selectionEnd = freshInput.value.length;
        }
      });
    }

    const clearSearchBtn = this.mount.querySelector('#btn-clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    const resetFilterBtn = this.mount.querySelector('#btn-reset-filters');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.currentCategory = 'all';
        this.render();
      });
    }

    // 3. Admin PIN orqali kirish (083010)
    const btnPinLogin = this.mount.querySelector('#btn-shop-pin-login');
    const pinModal = this.mount.querySelector('#shop-pin-modal');
    const pinForm = this.mount.querySelector('#shop-pin-form');
    const pinInput = this.mount.querySelector('#shop-pin-input');
    const pinError = this.mount.querySelector('#shop-pin-error');
    const btnCancelPin = this.mount.querySelector('#btn-cancel-shop-pin');

    if (btnPinLogin && pinModal) {
      btnPinLogin.addEventListener('click', () => {
        pinModal.style.display = 'flex';
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
        if (pinError) pinError.style.display = 'none';
      });
    }

    if (pinForm && pinInput) {
      pinForm.addEventListener('submit', () => {
        const val = pinInput.value.trim().replace(/\s+/g, '');
        if (val === '083010' || val.toLowerCase() === 'any3dcubicc') {
          sessionStorage.setItem('any3d_admin_auth', '083010');
          this.isAdmin = true;
          if (pinModal) pinModal.style.display = 'none';
          this.render();
        } else {
          if (pinError) {
            pinError.style.display = 'block';
            pinError.textContent = '🚫 Noto‘g‘ri PIN kod! Iltimos, to‘g‘ri kodni kiriting.';
          }
          pinInput.focus();
          pinInput.select();
        }
      });
    }

    if (btnCancelPin && pinModal) {
      btnCancelPin.addEventListener('click', () => {
        pinModal.style.display = 'none';
      });
    }

    // 4. Narxni tahrirlash (Edit Price) modalini ochish
    const editBtns = this.mount.querySelectorAll('[data-edit-id]');
    const editModal = this.mount.querySelector('#price-edit-modal');
    const editForm = this.mount.querySelector('#edit-price-form');
    const btnCloseEdit = this.mount.querySelector('#btn-close-edit');
    const btnCancelEdit = this.mount.querySelector('#btn-cancel-edit');

    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-edit-id');
        const prod = this.products.find(p => p.id === prodId);
        if (prod && editModal) {
          this.activeProductForEdit = prod;
          this.mount.querySelector('#edit-prod-id').value = prod.id;
          this.mount.querySelector('#edit-prod-title').textContent = `Narxni Tahrirlash: ${prod.name}`;
          this.mount.querySelector('#edit-input-name').value = prod.name;
          this.mount.querySelector('#edit-input-uzs').value = prod.priceUZS;
          this.mount.querySelector('#edit-input-usd').value = prod.priceUSD || Math.round(prod.priceUZS / 12700);
          this.mount.querySelector('#edit-input-badge').value = prod.badge || '';
          this.mount.querySelector('#edit-select-stock').value = prod.inStock ? 'true' : 'false';
          this.mount.querySelector('#edit-input-stock-status').value = prod.stockStatus || (prod.inStock ? 'Ustaxonada tayyor' : 'Tayyorlanish: 24 soat');
          editModal.style.display = 'flex';
        }
      });
    });

    if (editForm) {
      editForm.addEventListener('submit', async () => {
        const prodId = this.mount.querySelector('#edit-prod-id').value;
        const newName = this.mount.querySelector('#edit-input-name').value;
        const newUzs = Number(this.mount.querySelector('#edit-input-uzs').value);
        const newUsd = Number(this.mount.querySelector('#edit-input-usd').value);
        const newBadge = this.mount.querySelector('#edit-input-badge').value;
        const newInStock = this.mount.querySelector('#edit-select-stock').value === 'true';
        const newStockStatus = this.mount.querySelector('#edit-input-stock-status').value;

        const prodIdx = this.products.findIndex(p => p.id === prodId);
        if (prodIdx !== -1) {
          this.products[prodIdx] = {
            ...this.products[prodIdx],
            name: newName,
            priceUZS: newUzs,
            priceUSD: newUsd,
            badge: newBadge,
            inStock: newInStock,
            stockStatus: newStockStatus
          };
          localStorage.setItem('cached_models_v2', JSON.stringify(this.products));
        }

        // Serverga saqlash
        try {
          await fetch('/api/update-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pin: '083010',
              productId: prodId,
              name: newName,
              priceUZS: newUzs,
              priceUSD: newUsd,
              badge: newBadge,
              inStock: newInStock,
              stockStatus: newStockStatus
            })
          });
        } catch (err) {
          console.warn('Serverga narx saqlashda ogohlantirish:', err.message);
        }

        if (editModal) editModal.style.display = 'none';
        this.render();
      });
    }

    if (btnCloseEdit && editModal) {
      btnCloseEdit.addEventListener('click', () => {
        editModal.style.display = 'none';
      });
    }
    if (btnCancelEdit && editModal) {
      btnCancelEdit.addEventListener('click', () => {
        editModal.style.display = 'none';
      });
    }

    // 5. Chop etishga buyurtma berish (Checkout)
    const orderBtns = this.mount.querySelectorAll('[data-order-id]');
    const orderModal = this.mount.querySelector('#shop-order-modal');
    const orderForm = this.mount.querySelector('#shop-order-form');
    const orderSuccess = this.mount.querySelector('#shop-order-success');
    const btnCloseOrder = this.mount.querySelector('#btn-close-order');
    const btnCancelOrder = this.mount.querySelector('#btn-cancel-shop-order');
    const btnSuccClose = this.mount.querySelector('#btn-succ-close');

    orderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-order-id');
        const prod = this.products.find(p => p.id === prodId);
        if (prod && orderModal) {
          this.activeProductForOrder = prod;
          this.mount.querySelector('#order-hidden-prod-id').value = prod.id;
          this.mount.querySelector('#order-modal-prod-name').textContent = prod.name;
          this.mount.querySelector('#order-modal-prod-price').textContent = `Chop etish narxi: ${this.formatPrice(prod.priceUZS, prod.priceUSD)}`;
          this.mount.querySelector('#summary-prod-name').textContent = prod.name;
          this.mount.querySelector('#summary-prod-price').textContent = this.formatPrice(prod.priceUZS, prod.priceUSD);
          
          if (orderForm) orderForm.style.display = 'block';
          if (orderSuccess) orderSuccess.style.display = 'none';
          orderModal.style.display = 'flex';
        }
      });
    });

    if (orderForm) {
      orderForm.addEventListener('submit', async () => {
        const prod = this.activeProductForOrder;
        if (!prod) return;

        const custName = this.mount.querySelector('#shop-cust-name').value || 'Mijoz';
        const custPhone = this.mount.querySelector('#shop-cust-phone').value || '';
        const custTg = this.mount.querySelector('#shop-cust-tg')?.value || '';
        const custAddr = this.mount.querySelector('#shop-cust-addr')?.value || '';
        const custNotes = this.mount.querySelector('#shop-cust-notes')?.value || '';

        const orderCode = '#3D-' + Math.floor(1000 + Math.random() * 9000);

        const orderPayload = {
          orderId: orderCode,
          productId: prod.id,
          productName: prod.name,
          priceUZS: prod.priceUZS,
          priceUSD: prod.priceUSD,
          customerName: custName,
          customerPhone: custPhone,
          customerTelegram: custTg,
          deliveryAddress: custAddr,
          orderNotes: custNotes
        };

        // 1. Serverga yuborish
        let sentOk = false;
        try {
          const res = await fetch('/api/shop-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
          });
          if (res.ok) sentOk = true;
        } catch (e) {}

        // 2. Agar server bo'lmasa to'g'ridan-to'g'ri Telegram Bot API orqali @any3DCubicc ga yuborish
        if (!sentOk) {
          const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
          const adminId = '8929216064';
          if (botToken) {
            const cleanPhone = custPhone.replace(/[^0-9+]/g, '');
            const tgMsg = `
💎 <b>CREALITY 3D MODELINI CHOP ETISHGA BUYURTMA!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderCode}</code>
📦 <b>Model:</b> ${prod.name}
💰 <b>Chop etish narxi:</b> <b>${this.formatPrice(prod.priceUZS, prod.priceUSD)}</b>
👤 <b>Mijoz:</b> ${custName}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${custPhone}</a>
${custTg ? `💬 <b>Telegram:</b> ${custTg}\n` : ''}${custAddr ? `📍 <b>Manzil:</b> ${custAddr}\n` : ''}${custNotes ? `📝 <b>Izoh / Rang:</b> <i>"${custNotes}"</i>\n` : ''}
⚡ <i>Holat: 🟡 Yangi model buyurtmasi — dastgohni tayyorlang!</i>
            `.trim();

            const actionKeyboard = {
              inline_keyboard: [
                [
                  { text: '💬 Mijoz Telegrami', url: custTg ? `https://t.me/${custTg.replace('@', '')}` : `https://t.me/+${cleanPhone.replace('+', '')}` }
                ]
              ]
            };

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: adminId,
                text: tgMsg,
                parse_mode: 'HTML',
                reply_markup: actionKeyboard
              })
            }).catch(() => {});
          }
        }

        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (orderForm) orderForm.style.display = 'none';
        if (orderSuccess) {
          this.mount.querySelector('#shop-succ-num').textContent = orderCode;
          orderSuccess.style.display = 'block';
        }
      });
    }

    if (btnCloseOrder && orderModal) {
      btnCloseOrder.addEventListener('click', () => {
        orderModal.style.display = 'none';
      });
    }
    if (btnCancelOrder && orderModal) {
      btnCancelOrder.addEventListener('click', () => {
        orderModal.style.display = 'none';
      });
    }
    if (btnSuccClose && orderModal) {
      btnSuccClose.addEventListener('click', () => {
        orderModal.style.display = 'none';
      });
    }

    // 6. Yangi model qo'shish
    const btnAddProd = this.mount.querySelector('#btn-add-product');
    if (btnAddProd && editModal) {
      btnAddProd.addEventListener('click', () => {
        const newId = 'custom-model-' + Date.now();
        this.mount.querySelector('#edit-prod-id').value = newId;
        this.mount.querySelector('#edit-prod-title').textContent = 'Yangi 3D Model Qo‘shish';
        this.mount.querySelector('#edit-input-name').value = '';
        this.mount.querySelector('#edit-input-uzs').value = '50000';
        this.mount.querySelector('#edit-input-usd').value = '4';
        this.mount.querySelector('#edit-input-badge').value = 'Yangi Model';
        this.mount.querySelector('#edit-select-stock').value = 'true';
        this.mount.querySelector('#edit-input-stock-status').value = 'Ustaxonada tayyor';
        editModal.style.display = 'flex';
      });
    }
  }
}
