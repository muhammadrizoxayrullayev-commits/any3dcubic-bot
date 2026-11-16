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
          localStorage.setItem('cached_products', JSON.stringify(this.products));
          return;
        }
      }
    } catch (e) {
      console.warn('API orqali mahsulotlarni olishda ogohlantirish, keshdan tekshirilmoqda...');
    }

    // LocalStorage fallback
    try {
      const cached = JSON.parse(localStorage.getItem('cached_products') || '[]');
      if (cached.length > 0) {
        this.products = cached;
        return;
      }
    } catch (e) {}

    // Agar kesh ham bo'sh bo'lsa default Creality mahsulotlari
    this.products = this.getDefaultProducts();
    localStorage.setItem('cached_products', JSON.stringify(this.products));
  }

  getDefaultProducts() {
    return [
      {
        id: "creality-k1-max",
        category: "printers",
        categoryTitle: "3D Printerlar",
        name: "Creality K1 Max Flagship AI",
        subtitle: "Yuqori tezlikdagi CoreXY, Dual LiDAR & AI Kamera",
        priceUZS: 10800000,
        priceUSD: 850,
        oldPriceUZS: 11900000,
        badge: "🔥 Top Flagman",
        image: "https://img.crealitycloud.com/product/k1max.png",
        icon: "🖨️",
        crealityUrl: "https://www.crealitycloud.com/ru/product/k1-max",
        inStock: true,
        stockStatus: "Omborda mavjud (Toshkent)",
        specs: [
          "Bosish tezligi: 600 mm/s (Tezlanish: 20 000 mm/s²)",
          "Bosma hajmi: 300 × 300 × 300 mm",
          "AI LiDAR & 1080p AI Kamera",
          "Issiq stol: 120°C | Ekstruder: 300°C"
        ]
      },
      {
        id: "creality-k1c",
        category: "printers",
        categoryTitle: "3D Printerlar",
        name: "Creality K1C Carbon Fiber Edition",
        subtitle: "Karbon tola & Muhandislik kompozitlari uchun maxsus",
        priceUZS: 7500000,
        priceUSD: 590,
        oldPriceUZS: 8200000,
        badge: "⚡ Karbon Pro",
        image: "https://img.crealitycloud.com/product/k1c.png",
        icon: "🦾",
        crealityUrl: "https://www.crealitycloud.com/ru/product/k1c",
        inStock: true,
        stockStatus: "Omborda mavjud (Toshkent)",
        specs: [
          "Bosish tezligi: 600 mm/s",
          "Bosma hajmi: 220 × 220 × 250 mm",
          "Qattiqlashtirilgan po‘lat nozzl (PLA-CF, PETG-CF)",
          "To‘liq metall korpus va AI kamera"
        ]
      },
      {
        id: "creality-ender-3-v3",
        category: "printers",
        categoryTitle: "3D Printerlar",
        name: "Creality Ender-3 V3 (CoreXZ)",
        subtitle: "Inqilobiy CoreXZ kinematikasi, 600 mm/s tezlik",
        priceUZS: 4800000,
        priceUSD: 380,
        oldPriceUZS: 5300000,
        badge: "🏆 2026 Bestseller",
        image: "https://img.crealitycloud.com/product/ender3v3.png",
        icon: "⚡",
        crealityUrl: "https://www.crealitycloud.com/ru/product/ender-3-v3",
        inStock: true,
        stockStatus: "Omborda mavjud (Toshkent)",
        specs: [
          "Bosish tezligi: 600 mm/s",
          "Bosma hajmi: 220 × 220 × 250 mm",
          "CoreXZ tizimi (Tebranishsiz aniq qatlamlar)",
          "Avtomatik kalibrovka (1 bosish)"
        ]
      },
      {
        id: "creality-ender-3-v3-ke",
        category: "printers",
        categoryTitle: "3D Printerlar",
        name: "Creality Ender-3 V3 KE (Smart OS)",
        subtitle: "Klipper asosli Creality OS, Sensorli ekran & 500 mm/s",
        priceUZS: 3600000,
        priceUSD: 285,
        oldPriceUZS: 3950000,
        badge: "⭐ Xalq Tanlovi",
        image: "https://img.crealitycloud.com/product/ender3v3ke.png",
        icon: "📱",
        crealityUrl: "https://www.crealitycloud.com/ru/product/ender-3-v3-ke",
        inStock: true,
        stockStatus: "Omborda mavjud (Toshkent)",
        specs: [
          "Bosish tezligi: 500 mm/s",
          "Bosma hajmi: 220 × 220 × 240 mm",
          "Wi-Fi masofadan boshqaruv & Klipper",
          "CR Touch avtomatik nivelirlash"
        ]
      },
      {
        id: "creality-hyper-pla-1kg",
        category: "filaments",
        categoryTitle: "Filamentlar & Smola",
        name: "Creality Hyper Series PLA (1 kg)",
        subtitle: "600 mm/s yuqori tezlikka moslashtirilgan original filament",
        priceUZS: 240000,
        priceUSD: 19,
        oldPriceUZS: 270000,
        badge: "🚀 600mm/s Tezkor",
        image: "https://img.crealitycloud.com/product/hyperpla.png",
        icon: "🧵",
        crealityUrl: "https://www.crealitycloud.com/ru/product/hyper-pla",
        inStock: true,
        stockStatus: "Omborda barcha ranglar mavjud",
        specs: [
          "Og‘irligi: 1 kg netto | Diametri: 1.75 mm",
          "Tezlik: 50 – 600 mm/s gacha oqadi",
          "Ranglar: Oq, Qora, Kulrang, Qizil, Ko‘k"
        ]
      },
      {
        id: "creality-cr-petg-1kg",
        category: "filaments",
        categoryTitle: "Filamentlar & Smola",
        name: "Creality CR-PETG Yuqori Bardoshli (1 kg)",
        subtitle: "Mexanik mustahkam, namlikka va quyoshga chidamli plastik",
        priceUZS: 220000,
        priceUSD: 17.5,
        oldPriceUZS: 250000,
        badge: "🛡️ Mustahkam",
        image: "https://img.crealitycloud.com/product/petg.png",
        icon: "🔩",
        crealityUrl: "https://www.crealitycloud.com/ru/product/cr-petg",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "Og‘irligi: 1 kg | Diametri: 1.75 mm",
          "Erish harorati: 230°C – 250°C",
          "Kronshteynlar, korpuslar, texnik detallar uchun"
        ]
      },
      {
        id: "creality-space-pi-dryer",
        category: "accessories",
        categoryTitle: "Aksessuarlar & Zapchastlar",
        name: "Creality Space Pi Filament Dryer",
        subtitle: "Filamentni 360° issiq havo bilan quritish kamerasi (PTC 80W)",
        priceUZS: 680000,
        priceUSD: 54,
        oldPriceUZS: 780000,
        badge: "♨️ Top Aksessuar",
        image: "https://img.crealitycloud.com/product/dryer.png",
        icon: "📦",
        crealityUrl: "https://www.crealitycloud.com/ru/product/space-pi-dryer",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "Harorat: 45°C – 70°C real vaqtda",
          "Sensorli ekran va taymer",
          "Namlik pufakchalarini yo‘qotadi"
        ]
      },
      {
        id: "creality-nebula-smart-kit",
        category: "accessories",
        categoryTitle: "Aksessuarlar & Zapchastlar",
        name: "Creality Nebula Smart Kit (Display + AI Cam)",
        subtitle: "Ender-3 printerlarini tezlashtiruvchi Smart kamera va ekran",
        priceUZS: 890000,
        priceUSD: 70,
        oldPriceUZS: 990000,
        badge: "👁️ Smart Upgrade",
        image: "https://img.crealitycloud.com/product/nebula.png",
        icon: "📷",
        crealityUrl: "https://www.crealitycloud.com/ru/product/nebula-smart-kit",
        inStock: true,
        stockStatus: "Omborda mavjud",
        specs: [
          "4.3 dyuym sensorli IPS displey",
          "HD AI Kamera (Time-lapse video va masofaviy kuzatuv)",
          "Wi-Fi & Creality Cloud integratsiyasi"
        ]
      },
      {
        id: "creality-engineering-stl-bundle",
        category: "models",
        categoryTitle: "3D Modellar & STL",
        name: "Creality Cloud Premium: Muhandislik STL Arxiv Paketi",
        subtitle: "500+ sertifikatlangan CAD chizmalar, shesternalar, kronshteynlar",
        priceUZS: 150000,
        priceUSD: 12,
        oldPriceUZS: 250000,
        badge: "📁 500+ Model",
        image: "https://img.crealitycloud.com/product/cadbundle.png",
        icon: "📐",
        crealityUrl: "https://www.crealitycloud.com/ru/model-category/engineering",
        inStock: true,
        stockStatus: "Elektron formatda darhol yuklab olish",
        specs: [
          "Fayl formatlari: STL, STEP, OBJ, 3MF",
          "To‘liq chop etishga tayyor Creality Print profillari",
          "Tijoriy ishlab chiqarish ruxsati bilan"
        ]
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
              <span class="shop-creality-badge">CREALITY CLOUD • RASMIY HAMKOR</span>
              <div class="shop-admin-indicator">
                ${this.isAdmin ? `
                  <span class="admin-unlocked-badge">👑 Admin Rejimi Faol (PIN: 083010)</span>
                  <button type="button" class="btn-shop-add-prod" id="btn-add-product">➕ Yangi Mahsulot</button>
                ` : `
                  <button type="button" class="btn-shop-admin-login" id="btn-shop-pin-login">
                    🔐 Narxlarni Boshqarish (Admin)
                  </button>
                `}
              </div>
            </div>

            <h1 class="shop-title">Creality 3D Do‘koni & Uskunalar Markazi</h1>
            <p class="shop-desc">
              Dunyoga mashhur <b>Creality Cloud</b> (<a href="https://www.crealitycloud.com/ru" target="_blank" class="creality-link">www.crealitycloud.com/ru</a>) platformasining original 3D printerlari, tezyurar Hyper PLA filamentlari, aksessuarlari va eksklyuziv 3D modellari Toshkent omborida.
            </p>

            <div class="shop-stats-strip">
              <div class="s-stat"><span class="s-val">100%</span><span class="s-lbl">Original Creality</span></div>
              <div class="s-stat"><span class="s-val">600 mm/s</span><span class="s-lbl">Maksimal Tezlik</span></div>
              <div class="s-stat"><span class="s-val">Toshkent</span><span class="s-lbl">Tezkor Yetkazish</span></div>
              <div class="s-stat"><span class="s-val">Kafolat</span><span class="s-lbl">Rasmiy Texnik Ko‘mak</span></div>
            </div>
          </div>
        </div>

        <!-- Filterlar va Qidiruv Paneli -->
        <div class="shop-toolbar">
          <div class="shop-categories-pills">
            <button type="button" class="cat-pill ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">
              🌐 Barchasi (${this.products.length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'printers' ? 'active' : ''}" data-cat="printers">
              🖨️ 3D Printerlar (${this.products.filter(p => p.category === 'printers').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'filaments' ? 'active' : ''}" data-cat="filaments">
              🧵 Filamentlar & Smola (${this.products.filter(p => p.category === 'filaments').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'accessories' ? 'active' : ''}" data-cat="accessories">
              ⚙️ Aksessuarlar (${this.products.filter(p => p.category === 'accessories').length})
            </button>
            <button type="button" class="cat-pill ${this.currentCategory === 'models' ? 'active' : ''}" data-cat="models">
              📐 3D Modellar & STL (${this.products.filter(p => p.category === 'models').length})
            </button>
          </div>

          <div class="shop-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="shop-search-input" placeholder="Mahsulot qidirish (K1 Max, Ender-3, PLA, Nozzl...)" value="${this.searchQuery}">
            ${this.searchQuery ? '<button type="button" class="btn-clear-search" id="btn-clear-search">✕</button>' : ''}
          </div>
        </div>

        <!-- Mahsulotlar Ro'yxati (Grid) -->
        <div class="shop-products-grid">
          ${filtered.length === 0 ? `
            <div class="shop-empty-state">
              <div class="empty-icon">🔍</div>
              <h3>Mahsulot topilmadi</h3>
              <p>Qidiruv so‘rovingizni o‘zgartiring yoki boshqa toifani tanlang.</p>
              <button type="button" class="btn-reset-filters" id="btn-reset-filters">Barcha Mahsulotlarni Ko‘rsatish</button>
            </div>
          ` : filtered.map(p => `
            <div class="product-card ${p.category}" data-product-id="${p.id}">
              <div class="product-card-top">
                <span class="product-badge">${p.badge || 'Creality Original'}</span>
                <span class="stock-pill ${p.inStock ? 'in-stock' : 'pre-order'}">
                  ${p.inStock ? '🟢 Mavjud' : '🟡 Buyurtmaga'}
                </span>
              </div>

              <!-- Mahsulot Vizual Qutisi -->
              <div class="product-visual-box">
                <div class="product-icon-frame">${p.icon || '🖨️'}</div>
                <div class="product-category-tag">${p.categoryTitle || 'Creality'}</div>
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
                  <span class="stock-status-text">${p.stockStatus || (p.inStock ? 'Omborda mavjud' : 'Yetkazish: 3-5 kun')}</span>
                </div>

                <!-- Harakat Tugmalari -->
                <div class="product-card-actions">
                  <button type="button" class="btn-order-product" data-order-id="${p.id}">
                    🛒 Buyurtma Berish
                  </button>
                  <a href="${p.crealityUrl || 'https://www.crealitycloud.com/ru'}" target="_blank" class="btn-view-creality" title="Creality Cloud rasmiy sahifasini ochish">
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
                  <h3 id="edit-prod-title">Narxni Tahrirlash</h3>
                  <small id="edit-prod-sub">Faqat bosh administrator uchun</small>
                </div>
              </div>
              <button type="button" class="shop-modal-close" id="btn-close-edit">✕</button>
            </div>

            <form class="edit-price-form" id="edit-price-form" onsubmit="return false;">
              <input type="hidden" id="edit-prod-id" value="">
              
              <div class="form-field">
                <label>Mahsulot Nomi:</label>
                <input type="text" id="edit-input-name" required>
              </div>

              <div class="form-row-dual">
                <div class="form-field">
                  <label>Narxi (SO‘M da) *</label>
                  <input type="number" id="edit-input-uzs" placeholder="10800000" required>
                </div>
                <div class="form-field">
                  <label>Narxi (USD da) *</label>
                  <input type="number" id="edit-input-usd" placeholder="850" required>
                </div>
              </div>

              <div class="form-row-dual">
                <div class="form-field">
                  <label>Maxsus Nishon (Badge):</label>
                  <input type="text" id="edit-input-badge" placeholder="🔥 Top Flagman">
                </div>
                <div class="form-field">
                  <label>Ombor Holati:</label>
                  <select id="edit-select-stock">
                    <option value="true">🟢 Omborda mavjud</option>
                    <option value="false">🟡 Buyurtmaga (3-5 kun)</option>
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label>Ombor Holati Matni:</label>
                <input type="text" id="edit-input-stock-status" placeholder="Omborda mavjud (Toshkent)">
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

        <!-- 🛒 BUYURTMA BERISH MODALI (CHECKOUT) -->
        <div class="shop-modal-backdrop" id="shop-order-modal" style="display: none;">
          <div class="shop-modal-card">
            <div class="shop-modal-header">
              <div class="s-modal-title">
                <span class="s-m-icon">🛍️</span>
                <div>
                  <h3 id="order-modal-prod-name">Mahsulotga Buyurtma</h3>
                  <small id="order-modal-prod-price">Toshkent bo‘yicha tezkor yetkazish</small>
                </div>
              </div>
              <button type="button" class="shop-modal-close" id="btn-close-order">✕</button>
            </div>

            <form class="shop-order-form" id="shop-order-form" onsubmit="return false;">
              <input type="hidden" id="order-hidden-prod-id" value="">
              
              <div class="form-row-dual">
                <div class="form-field">
                  <label>Ismingiz *</label>
                  <input type="text" id="shop-cust-name" placeholder="Ismingizni yozing" required>
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
                  <input type="text" id="shop-cust-addr" placeholder="Toshkent shahri yoki viloyat">
                </div>
              </div>

              <div class="form-field">
                <label>Qo‘shimcha Izoh:</label>
                <textarea id="shop-cust-notes" rows="2" placeholder="Rang yoki qulay vaqt..."></textarea>
              </div>

              <div class="order-summary-box">
                <div class="o-sum-row">
                  <span>Tanlangan Mahsulot:</span>
                  <strong id="summary-prod-name">-</strong>
                </div>
                <div class="o-sum-row total">
                  <span>To‘lov Summasi:</span>
                  <strong id="summary-prod-price" style="color: #00f0ff;">-</strong>
                </div>
              </div>

              <div class="shop-modal-actions">
                <button type="submit" class="btn-submit-shop-order" id="btn-submit-shop-order">
                  🚀 Buyurtmani Tasdiqlash
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
                Buyurtmangiz Toshkent 3D Ustaxonasi bosh administratori (<b>@any3DCubicc</b>) ga yetkazildi. Tez orada siz bilan bog‘lanamiz!
              </p>
              <div class="succ-btns">
                <a href="https://t.me/Any3dCubic_bot" target="_blank" class="btn-succ-bot">
                  🤖 Botda Holatni Ko‘rish (@Any3dCubic_bot)
                </a>
                <button type="button" class="btn-succ-close" id="btn-succ-close">
                  Do‘konga Qaytish
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 🔐 SHOP ADMIN PIN MODAL -->
        <div class="shop-modal-backdrop" id="shop-pin-modal" style="display: none;">
          <div class="shop-modal-card pin-card">
            <div class="pin-badge">👑 NARX BOSHQARUVI</div>
            <h3>Admin PIN Kodini Kiriting</h3>
            <p>Narxlarni tahrirlash huquqi faqat maxfiy PIN kodga ega bosh administratorga berilgan.</p>
            
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
        const grid = this.mount.querySelector('.shop-products-grid');
        // Render faqat gridni yangilashi mumkin, ammo butun komponentni yangilash oson
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

    // 3. Admin PIN orqali kirish
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
          this.mount.querySelector('#edit-input-stock-status').value = prod.stockStatus || (prod.inStock ? 'Omborda mavjud' : 'Buyurtmaga');
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
          localStorage.setItem('cached_products', JSON.stringify(this.products));
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

    // 5. Buyurtma berish (Checkout) modalini ochish
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
          this.mount.querySelector('#order-modal-prod-price').textContent = `Narxi: ${this.formatPrice(prod.priceUZS, prod.priceUSD)}`;
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

        const orderCode = '#SHOP-' + Math.floor(1000 + Math.random() * 9000);

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
🛍️ <b>CREALITY DO‘KONIDAN YANGI BUYURTMA!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderCode}</code>
📦 <b>Mahsulot:</b> ${prod.name}
💰 <b>Narxi:</b> <b>${this.formatPrice(prod.priceUZS, prod.priceUSD)}</b>
👤 <b>Mijoz:</b> ${custName}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${custPhone}</a>
${custTg ? `💬 <b>Telegram:</b> ${custTg}\n` : ''}${custAddr ? `📍 <b>Manzil:</b> ${custAddr}\n` : ''}${custNotes ? `📝 <b>Izoh:</b> <i>"${custNotes}"</i>\n` : ''}
⚡ <i>Holat: 🟡 Yangi buyurtma — mijoz bilan bog‘laning!</i>
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

    // 6. Yangi mahsulot qo'shish
    const btnAddProd = this.mount.querySelector('#btn-add-product');
    if (btnAddProd && editModal) {
      btnAddProd.addEventListener('click', () => {
        const newId = 'custom-' + Date.now();
        this.mount.querySelector('#edit-prod-id').value = newId;
        this.mount.querySelector('#edit-prod-title').textContent = 'Yangi Mahsulot Qo‘shish';
        this.mount.querySelector('#edit-input-name').value = '';
        this.mount.querySelector('#edit-input-uzs').value = '1000000';
        this.mount.querySelector('#edit-input-usd').value = '80';
        this.mount.querySelector('#edit-input-badge').value = 'Yangi';
        this.mount.querySelector('#edit-select-stock').value = 'true';
        this.mount.querySelector('#edit-input-stock-status').value = 'Omborda mavjud';
        editModal.style.display = 'flex';
      });
    }
  }
}
