import './style.css';
import { ThreeStudio } from './components/ThreeStudio.js';
import { OrderConfigurator } from './components/OrderConfigurator.js';
import { PitchDeck } from './components/PitchDeck.js';
import { OrderTracker } from './components/OrderTracker.js';
import { AdminCRM } from './components/AdminCRM.js';

class App {
  constructor() {
    this.appContainer = document.querySelector('#app');
    this.currentView = 'configurator';
    this.currency = 'UZS';
    this.threeStudio = null;
    this.configurator = null;
    this.pitchDeck = null;
    this.orderTracker = null;
    this.adminCRM = null;
    this.latestOrder = null;

    this.init();
  }

  init() {
    this.initTelegramWebApp();
    this.renderShell();
    this.mountView();
    this.attachNavListeners();
  }

  initTelegramWebApp() {
    if (window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (typeof tg.requestFullscreen === 'function') {
          tg.requestFullscreen();
        }
        if (typeof tg.enableClosingConfirmation === 'function') {
          tg.enableClosingConfirmation();
        }
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor('#090e1a');
        }
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor('#090e1a');
        }
      } catch (e) {
        console.warn('Telegram WebApp init error:', e);
      }
    }
  }

  renderShell() {
    this.appContainer.innerHTML = `
      <!-- Global Navigatsiya Paneli -->
      <nav class="app-navbar">
        <div class="brand-group" id="nav-brand">
          <div class="brand-icon">
            <img src="./logo_nav.png" alt="Any3DCubic" class="nav-logo-img">
          </div>
          <div class="brand-text">
            <h1>Toshkent 3D Ustaxonasi</h1>
            <div class="brand-sub">
              <span>●</span> Tezkor Mahalliy 3D Bosma & Prototip Xizmati
            </div>
          </div>
        </div>

        <!-- Rejimlar Almashinuvi (4 ta to'liq rejim) -->
        <div class="mode-switcher-nav">
          <button type="button" class="nav-tab-btn ${this.currentView === 'configurator' ? 'active' : ''}" data-view="configurator" id="tab-config">
            <span class="tab-icon">🛒</span>
            <span class="tab-text-full">Buyurtma Portali va 3D Studiya</span>
            <span class="tab-text-short">Buyurtma</span>
          </button>
          <button type="button" class="nav-tab-btn ${this.currentView === 'pitch' ? 'active-pitch' : ''}" data-view="pitch" id="tab-pitch">
            <span class="tab-icon">💼</span>
            <span class="tab-text-full">Tanlov Pitchi & Moliyaviy Model</span>
            <span class="tab-text-short">Pitch & Model</span>
          </button>
          <button type="button" class="nav-tab-btn ${this.currentView === 'tracker' ? 'active' : ''}" data-view="tracker" id="tab-tracker">
            <span class="tab-icon">📦</span>
            <span class="tab-text-full">Buyurtmani Kuzatish & Chat</span>
            <span class="tab-text-short">Kuzatuv & Chat</span>
          </button>
          <button type="button" class="nav-tab-btn ${this.currentView === 'admin' ? 'active-admin' : ''}" data-view="admin" id="tab-admin">
            <span class="tab-icon">🛡️</span>
            <span class="tab-text-full">Admin CRM & Chat</span>
            <span class="tab-text-short">Admin CRM</span>
          </button>
        </div>

        <!-- O'ng Tomondagi Qo'shimcha Tugmalar -->
        <div class="header-right-tools">
          <button type="button" class="btn-location-pill" id="btn-open-location" title="Ustaxona lokatsiyasini xaritada ochish (Google / Yandex Maps)">
            <span class="loc-pin">📍</span>
            <span class="loc-name">Chilonzor, Toshkent</span>
            <span class="loc-tag">Xarita</span>
          </button>
          <button type="button" class="btn-fullscreen-toggle" id="btn-fullscreen" title="Brauzer tepasini yashirish (To'liq ekran)">
            ⛶ <span>To‘liq Ekran</span>
          </button>
          <div class="currency-toggle">
            <button type="button" class="curr-btn ${this.currency === 'UZS' ? 'active' : ''}" data-curr="UZS">SO‘M</button>
            <button type="button" class="curr-btn ${this.currency === 'USD' ? 'active' : ''}" data-curr="USD">USD</button>
          </div>
        </div>
      </nav>

      <!-- Asosiy Dinamik Maydon -->
      <main id="main-content"></main>

      <!-- 📍 USTAXONA LOKATSIYASI VA XARITA MODALI -->
      <div class="location-modal-backdrop" id="location-modal" style="display: none;">
        <div class="location-modal-card">
          <div class="loc-modal-header">
            <div class="loc-modal-title-group">
              <span class="loc-modal-icon">📍</span>
              <div>
                <h3>Any3D Ustaxonasi Manzili & Lokatsiya</h3>
                <p>Toshkent shahri, Chilonzor tumani</p>
              </div>
            </div>
            <button type="button" class="loc-modal-close" id="btn-close-location">✕</button>
          </div>

          <div class="loc-modal-body">
            <!-- Vizual Kiber Xarita Qutisi -->
            <div class="loc-visual-map-box">
              <div class="loc-map-glow"></div>
              <div class="loc-map-pin-pulse">
                <span class="pin-wave"></span>
                <div class="pin-badge">🖨️ Any3D Ustaxona (Chilonzor)</div>
              </div>
              <div class="loc-map-coordinates">41.272145° N, 69.204523° E • Chilonzor 9-mavze</div>
            </div>

            <!-- Aniq Manzil Ma'lumotlari -->
            <div class="loc-address-details">
              <div class="loc-row">
                <span class="loc-k">🏬 Aniq Manzil:</span>
                <strong class="loc-v">Toshkent shahri, Chilonzor tumani, 9-mavze, 12-bino</strong>
              </div>
              <div class="loc-row">
                <span class="loc-k">🎯 Mo‘ljal:</span>
                <span class="loc-v">Chilonzor metro bekati, Chilonzor Savdo Markazi yaqinida</span>
              </div>
              <div class="loc-row">
                <span class="loc-k">⏱️ Ish Vaqti:</span>
                <span class="loc-v">Dushanba – Shanba: 09:00 dan 20:00 gacha (Yakshanba: Navbatdagi buyurtmalar)</span>
              </div>
              <div class="loc-row">
                <span class="loc-k">📞 Telefon:</span>
                <strong class="loc-v"><a href="tel:+998901234567">+998 (90) 123-45-67</a></strong>
              </div>
            </div>

            <!-- Xaritalar Tugmalari -->
            <div class="loc-action-buttons">
              <a href="https://www.google.com/maps/dir/?api=1&destination=41.272145,69.204523" target="_blank" class="btn-map-app google-map-btn">
                <span class="map-icon">🗺️</span>
                <div class="map-btn-meta">
                  <strong>Google Maps orqali ochish</strong>
                  <small>Marshrut chizish va navigatsiya</small>
                </div>
              </a>

              <a href="https://yandex.com/maps/?rtext=~41.272145,69.204523&rtt=auto" target="_blank" class="btn-map-app yandex-map-btn">
                <span class="map-icon">📍</span>
                <div class="map-btn-meta">
                  <strong>Yandex Maps / Go orqali ochish</strong>
                  <small>Avtomobil va piyoda navigatsiyasi</small>
                </div>
              </a>

              <a href="https://maps.apple.com/?daddr=41.272145,69.204523" target="_blank" class="btn-map-app apple-map-btn">
                <span class="map-icon">🍏</span>
                <div class="map-btn-meta">
                  <strong>Apple Maps orqali ochish</strong>
                  <small>iPhone / iPad navigatsiyasi</small>
                </div>
              </a>

              <button type="button" class="btn-copy-address" id="btn-copy-loc-addr">
                📋 Manzilni Nusxalash
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mountView() {
    const mainContent = this.appContainer.querySelector('#main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '';

    const tabs = this.appContainer.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      const view = tab.getAttribute('data-view');
      tab.classList.remove('active', 'active-pitch', 'active-admin');
      if (view === this.currentView) {
        if (view === 'pitch') tab.classList.add('active-pitch');
        else if (view === 'admin') tab.classList.add('active-admin');
        else tab.classList.add('active');
      }
    });

    if (this.currentView === 'configurator') {
      const configMount = document.createElement('div');
      mainContent.appendChild(configMount);

      if (!this.threeStudio) {
        const dummyCanvasContainer = document.createElement('div');
        this.threeStudio = new ThreeStudio(dummyCanvasContainer, {
          initialMaterial: 'PETG',
          initialColor: '#ff6600'
        });
      }

      this.configurator = new OrderConfigurator(
        configMount,
        this.threeStudio,
        (orderData) => {
          this.latestOrder = orderData;
          this.currentView = 'tracker';
          this.mountView();
        }
      );
      this.configurator.setCurrency(this.currency);

      setTimeout(() => {
        if (this.threeStudio) this.threeStudio.onResize();
      }, 50);

    } else if (this.currentView === 'pitch') {
      const pitchMount = document.createElement('div');
      mainContent.appendChild(pitchMount);

      this.pitchDeck = new PitchDeck(
        pitchMount,
        () => {
          this.currentView = 'configurator';
          this.mountView();
        }
      );

    } else if (this.currentView === 'tracker') {
      const trackerMount = document.createElement('div');
      mainContent.appendChild(trackerMount);

      this.orderTracker = new OrderTracker(
        trackerMount,
        this.latestOrder,
        () => {
          this.currentView = 'configurator';
          this.mountView();
        }
      );

    } else if (this.currentView === 'admin') {
      const adminMount = document.createElement('div');
      mainContent.appendChild(adminMount);

      this.adminCRM = new AdminCRM(adminMount, {
        onViewChange: (view) => {
          this.currentView = view;
          this.mountView();
        }
      });
    }
  }

  attachNavListeners() {
    const nav = this.appContainer.querySelector('.mode-switcher-nav');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-tab-btn');
        if (btn) {
          const view = btn.getAttribute('data-view');
          if (view && view !== this.currentView) {
            this.currentView = view;
            this.mountView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    }

    const brand = this.appContainer.querySelector('#nav-brand');
    if (brand) {
      brand.addEventListener('click', () => {
        this.currentView = 'configurator';
        this.mountView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const currToggle = this.appContainer.querySelector('.currency-toggle');
    if (currToggle) {
      currToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.curr-btn');
        if (btn) {
          const curr = btn.getAttribute('data-curr');
          if (curr && curr !== this.currency) {
            this.currency = curr;
            const allCurrBtns = currToggle.querySelectorAll('.curr-btn');
            allCurrBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (this.currentView === 'configurator' && this.configurator) {
              this.configurator.setCurrency(curr);
            }
          }
        }
      });
    }

    // 📍 LOKATSIYA MODALI OCHISH / YOPISH
    const locBtn = this.appContainer.querySelector('#btn-open-location');
    const locModal = this.appContainer.querySelector('#location-modal');
    const locClose = this.appContainer.querySelector('#btn-close-location');
    const locCopy = this.appContainer.querySelector('#btn-copy-loc-addr');

    if (locBtn && locModal) {
      locBtn.addEventListener('click', () => {
        locModal.style.display = 'flex';
      });
    }

    if (locClose && locModal) {
      locClose.addEventListener('click', () => {
        locModal.style.display = 'none';
      });
    }

    if (locModal) {
      locModal.addEventListener('click', (e) => {
        if (e.target === locModal) {
          locModal.style.display = 'none';
        }
      });
    }

    if (locCopy) {
      locCopy.addEventListener('click', () => {
        const text = 'Toshkent shahri, Chilonzor tumani, 9-mavze, 12-bino (Any3D Ustaxonasi)';
        navigator.clipboard.writeText(text).then(() => {
          locCopy.textContent = '✅ Manzil nusxalandi!';
          setTimeout(() => {
            locCopy.textContent = '📋 Manzilni Nusxalash';
          }, 2500);
        });
      });
    }

    // To'liq ekran tugmasi (brauzer tepasini yashirish)
    const fsBtn = this.appContainer.querySelector('#btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (window.Telegram?.WebApp) {
          try {
            window.Telegram.WebApp.expand();
            if (typeof window.Telegram.WebApp.requestFullscreen === 'function') {
              window.Telegram.WebApp.requestFullscreen();
            }
          } catch (e) {}
        }
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fsBtn.innerHTML = '🗗 <span>Oddiy Ekran</span>';
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
          fsBtn.innerHTML = '⛶ <span>To‘liq Ekran</span>';
        }
      });

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          fsBtn.innerHTML = '⛶ <span>To‘liq Ekran</span>';
        } else {
          fsBtn.innerHTML = '🗗 <span>Oddiy Ekran</span>';
        }
      });
    }
  }
}

new App();