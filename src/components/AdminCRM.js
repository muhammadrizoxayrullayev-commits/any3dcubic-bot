export class AdminCRM {
  constructor(mountElement, options = {}) {
    this.mount = typeof mountElement === 'string' ? document.querySelector(mountElement) : mountElement;
    this.orders = [];
    this.filterStatus = 'all'; // 'all', 'pending', 'approved', 'declined'
    this.searchQuery = '';
    this.activeChatOrder = null;
    this.chatMessages = [];
    this.chatPoller = null;
    this.onViewChange = options.onViewChange || null;

    this.init();
  }

  async init() {
    await this.fetchOrders();
    this.render();
    this.startOrderPoller();
  }

  startOrderPoller() {
    this.orderPoller = setInterval(async () => {
      await this.fetchOrders(true);
    }, 4000);
  }

  destroy() {
    if (this.orderPoller) clearInterval(this.orderPoller);
    if (this.chatPoller) clearInterval(this.chatPoller);
  }

  async fetchOrders(silent = false) {
    try {
      const res = await fetch('/api/admin-orders');
      const data = await res.json();
      if (data.ok && Array.isArray(data.orders)) {
        this.orders = data.orders;
        if (!silent) this.render();
      }
    } catch (e) {
      // Fallback from localStorage
      try {
        const local = JSON.parse(localStorage.getItem('cached_admin_orders') || '[]');
        if (local.length > 0 && this.orders.length === 0) {
          this.orders = local;
          if (!silent) this.render();
        }
      } catch (err) {}
    }
  }

  getFilteredOrders() {
    return this.orders.filter(order => {
      // Filter status
      if (this.filterStatus !== 'all') {
        const orderStatus = order.status || 'pending';
        if (orderStatus !== this.filterStatus) return false;
      }
      // Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const str = `${order.orderId || ''} ${order.customerName || ''} ${order.customerPhone || ''} ${order.orderTypeTitle || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }

  render() {
    const totalOrders = this.orders.length;
    const pendingOrders = this.orders.filter(o => !o.status || o.status === 'pending').length;
    const approvedOrders = this.orders.filter(o => o.status === 'approved').length;
    const declinedOrders = this.orders.filter(o => o.status === 'declined').length;
    const filtered = this.getFilteredOrders();

    this.mount.innerHTML = `
      <div class="admin-crm-wrapper">
        <!-- CRM Bosh Sarlavhasi -->
        <div class="crm-top-bar">
          <div class="crm-title-area">
            <div class="crm-badge">👑 YAGONA BOSH ADMINISTRATOR: @any3DCubicc</div>
            <h2 class="crm-main-title">Mijozlar Profili va Buyurtmalar Boshqaruvi</h2>
            <p class="crm-sub-text">
              Faqat <b>@any3DCubicc</b> uchun maxsus boshqaruv portali. Barcha buyurtmalarni tasdiqlash (Approve) va rad etish (Decline) vakolati faqat sizda.
            </p>
          </div>

          <div class="crm-quick-actions">
            <button type="button" class="btn-crm-shop" id="btn-crm-shop" style="background: rgba(0, 210, 106, 0.15); border: 1px solid rgba(0, 210, 106, 0.4); color: #00d26a; padding: 0.5rem 0.9rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700;">
              💎 Creality Modellar & Narxlar
            </button>
            <button type="button" class="btn-crm-refresh" id="btn-crm-refresh">🔄 Yangilash</button>
            <a href="https://t.me/Any3dCubic_bot" target="_blank" class="btn-crm-tg">
              🤖 Telegram Bot (@Any3dCubic_bot)
            </a>
            <button type="button" class="btn-crm-logout" id="btn-crm-logout" title="Admin paneldan chiqish" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 0.5rem 0.9rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700;">
              🔒 Chiqish
            </button>
          </div>
        </div>

        <!-- Statistika Ko'rsatkichlari -->
        <div class="crm-stats-grid">
          <div class="crm-stat-card total">
            <div class="stat-icon">📦</div>
            <div class="stat-meta">
              <span class="stat-num">${totalOrders}</span>
              <span class="stat-lbl">Jami Buyurtmalar</span>
            </div>
          </div>
          <div class="crm-stat-card pending">
            <div class="stat-icon">⏳</div>
            <div class="stat-meta">
              <span class="stat-num">${pendingOrders}</span>
              <span class="stat-lbl">Admin Tasdig‘i Kutilmoqda</span>
            </div>
          </div>
          <div class="crm-stat-card approved">
            <div class="stat-icon">✅</div>
            <div class="stat-meta">
              <span class="stat-num">${approvedOrders}</span>
              <span class="stat-lbl">Tasdiqlangan & Chop Etilmoqda</span>
            </div>
          </div>
          <div class="crm-stat-card declined">
            <div class="stat-icon">❌</div>
            <div class="stat-meta">
              <span class="stat-num">${declinedOrders}</span>
              <span class="stat-lbl">Rad Etilgan (Fake cheklar)</span>
            </div>
          </div>
        </div>

        <!-- Filterlar va Qidiruv Qatori -->
        <div class="crm-filter-bar">
          <div class="crm-filter-pills">
            <button type="button" class="crm-pill ${this.filterStatus === 'all' ? 'active' : ''}" data-filter="all">
              Barchasi (${totalOrders})
            </button>
            <button type="button" class="crm-pill pill-pend ${this.filterStatus === 'pending' ? 'active' : ''}" data-filter="pending">
              🟡 Kutilmoqda (${pendingOrders})
            </button>
            <button type="button" class="crm-pill pill-appr ${this.filterStatus === 'approved' ? 'active' : ''}" data-filter="approved">
              🟢 Tasdiqlanganlar (${approvedOrders})
            </button>
            <button type="button" class="crm-pill pill-decl ${this.filterStatus === 'declined' ? 'active' : ''}" data-filter="declined">
              🔴 Rad Etilganlar (${declinedOrders})
            </button>
          </div>

          <div class="crm-search-wrapper">
            <input type="text" id="crm-search-input" placeholder="Mijoz ismi, tel yoki buyurtma #..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Mijozlar Kartalari Ro'yxati -->
        <div class="crm-orders-grid">
          ${filtered.length === 0 ? `
            <div class="crm-empty-state">
              <div class="empty-icon">📭</div>
              <h3>Hozircha buyurtmalar topilmadi</h3>
              <p>Mijozlar buyurtma berganda bu yerda ularning to‘liq profili va cheklari ko‘rinadi.</p>
            </div>
          ` : filtered.map(order => this.renderOrderCard(order)).join('')}
        </div>

        <!-- Admin Jonli Chat Paneli (Drawer / Modal) -->
        <div class="admin-chat-modal-backdrop" id="admin-chat-modal" style="${this.activeChatOrder ? 'display: flex;' : 'display: none;'}">
          ${this.activeChatOrder ? this.renderChatDrawer() : ''}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderOrderCard(order) {
    const status = order.status || 'pending';
    const cleanPhone = (order.customerPhone || '').replace(/[^0-9+]/g, '');
    const hasReceipt = Boolean(order.receiptImage);
    const delivTitle = order.deliveryMethodTitle || (order.deliveryMethod === 'bts' ? '📦 Viloyat (BTS Pochta)' : (order.deliveryMethod === 'yandex' ? '🛵 Toshkent (Yandex Go)' : '🏬 Ustaxonadan Olib Ketish'));

    return `
      <div class="crm-order-card status-${status}" data-order-id="${order.orderId}">
        <div class="order-card-header">
          <div class="order-id-badge">
            <strong>${order.orderId || '#T3D'}</strong>
            <span class="order-time">${order.createdAt ? new Date(order.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Yangi'}</span>
          </div>

          <div class="order-status-tag tag-${status}">
            ${status === 'approved' ? '🟢 Tasdiqlangan' : (status === 'declined' ? '🔴 Rad Etilgan' : '🟡 Kutilmoqda')}
          </div>
        </div>

        <div class="customer-profile-block">
          <div class="cust-avatar">👤</div>
          <div class="cust-info">
            <h4 class="cust-name">${order.customerName || 'Mijoz'}</h4>
            <div class="cust-contact-links">
              <a href="tel:${cleanPhone}" class="cust-phone-link">📞 ${order.customerPhone || 'Tel kiritilmagan'}</a>
              ${order.customerTelegram ? `<a href="https://t.me/${order.customerTelegram.replace('@', '')}" target="_blank" class="cust-tg-link">💬 ${order.customerTelegram}</a>` : ''}
            </div>
          </div>
        </div>

        <div class="order-specs-list">
          <div class="spec-row">
            <span class="sk">Mahsulot:</span>
            <strong class="sv">${order.orderTypeTitle || '3D Detal'}</strong>
          </div>
          <div class="spec-row">
            <span class="sk">Material & Soni:</span>
            <span class="sv">${order.material || 'PETG'} • ${order.quantity || 1} dona</span>
          </div>
          <div class="spec-row">
            <span class="sk">Umumiy Summa:</span>
            <strong class="sv price">${order.grandTotal || '0'}</strong>
          </div>
          <div class="spec-row">
            <span class="sk">Yetkazish Usuli:</span>
            <span class="sv deliv-val">${delivTitle}</span>
          </div>
          ${order.deliveryAddress ? `
            <div class="spec-row">
              <span class="sk">Manzili:</span>
              <span class="sv address-val">📍 ${order.deliveryAddress}</span>
            </div>
          ` : ''}
          ${order.orderNotes ? `
            <div class="spec-row notes">
              <span class="sk">Izoh:</span>
              <span class="sv">${order.orderNotes}</span>
            </div>
          ` : ''}
        </div>

        <!-- To'lov Cheki Skrinshoti -->
        <div class="receipt-admin-box">
          <div class="receipt-header">
            <span>To‘lov Kvitansiyasi:</span>
            ${hasReceipt ? '<span class="receipt-ok-tag">✅ Rasm mavjud</span>' : '<span class="receipt-no-tag">⚠️ Rasm yo‘q</span>'}
          </div>
          ${hasReceipt ? `
            <div class="receipt-thumb-wrapper" data-thumb-order="${order.orderId}">
              <img src="${order.receiptImage}" alt="Chek" class="receipt-thumb-img">
              <span class="thumb-zoom-hint">🔍 Kattalashtirish</span>
            </div>
          ` : `
            <div class="no-receipt-notice">Kuryerga / Qabul qilinganda to‘lash belgilangan</div>
          `}
        </div>

        <!-- Boshqaruv Tugmalari -->
        <div class="crm-card-actions">
          <button type="button" class="btn-crm-chat" data-chat-id="${order.orderId}">
            💬 Mijoz Bilan Chat
          </button>
          
          ${status === 'pending' ? `
            <div class="review-btn-pair">
              <button type="button" class="btn-crm-approve" data-approve-id="${order.orderId}">
                ✅ Tasdiqlash
              </button>
              <button type="button" class="btn-crm-decline" data-decline-id="${order.orderId}">
                ❌ Rad Etish
              </button>
            </div>
          ` : (status === 'approved' ? `
            <button type="button" class="btn-crm-revert" data-decline-id="${order.orderId}">
              ❌ Bekor Qilish (Atkaz)
            </button>
          ` : `
            <button type="button" class="btn-crm-revert" data-approve-id="${order.orderId}">
              ✅ Qayta Tasdiqlash
            </button>
          `)}
        </div>
      </div>
    `;
  }

  renderChatDrawer() {
    const order = this.activeChatOrder;
    if (!order) return '';

    return `
      <div class="admin-chat-modal-box">
        <div class="adchat-header">
          <div class="adchat-title-group">
            <span class="adchat-avatar">👤</span>
            <div>
              <h3>${order.customerName || 'Mijoz'} bilan Jonli Muloqot</h3>
              <p>Buyurtma ID: <strong>${order.orderId}</strong> • Tel: <a href="tel:${order.customerPhone}">${order.customerPhone}</a></p>
            </div>
          </div>
          <button type="button" class="adchat-close" id="btn-close-adchat">✕</button>
        </div>

        <div class="adchat-messages-body" id="adchat-messages-body">
          ${this.chatMessages.length === 0 ? `
            <div class="adchat-empty">
              <span>💬</span>
              <p>Hozircha xabarlar yo‘q. Mijozga birinchi bo‘lib xabar yo‘llashingiz mumkin.</p>
            </div>
          ` : this.chatMessages.map(m => `
            <div class="chat-bubble ${m.sender === 'admin' ? 'admin' : 'customer'}">
              <div class="bubble-sender">${m.sender === 'admin' ? '👨‍💼 Siz (Admin)' : '👤 ' + (m.senderName || 'Mijoz')}</div>
              <div class="bubble-text">${m.text}</div>
              <div class="bubble-time">${new Date(m.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          `).join('')}
        </div>

        <!-- Tezkor Javob Shablonlari -->
        <div class="adchat-quick-templates">
          <button type="button" class="ad-tpl-btn" data-tpl="Assalomu alaykum! Buyurtmangiz qabul qilindi, 3D chop etish boshlandi.">✅ Qabul qilindi</button>
          <button type="button" class="ad-tpl-btn" data-tpl="Mahsulotingiz tayyor bo‘ldi! Yandex kuryer orqali jo‘natamizmi?">🛵 Tayyor bo‘ldi</button>
          <button type="button" class="ad-tpl-btn" data-tpl="To‘lov chekingiz tasdiqlanmadi, iltimos haqiqiy chekni qayta yuboring.">⚠️ Chek xatosi</button>
        </div>

        <!-- Xabar Yozish Maydoni -->
        <div class="adchat-input-bar">
          <input type="text" id="adchat-input-field" placeholder="Mijozga xabar yozing...">
          <button type="button" class="btn-adchat-send" id="btn-adchat-send">Yuborish 🚀</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const btnShop = this.mount.querySelector('#btn-crm-shop');
    if (btnShop && this.onViewChange) {
      btnShop.addEventListener('click', () => {
        this.onViewChange('shop');
      });
    }

    // Refresh button
    const btnRefresh = this.mount.querySelector('#btn-crm-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        btnRefresh.textContent = 'Yuklanmoqda...';
        await this.fetchOrders();
        btnRefresh.textContent = '🔄 Yangilash';
      });
    }

    const btnLogout = this.mount.querySelector('#btn-crm-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('any3d_admin_auth');
        window.location.href = window.location.pathname;
      });
    }

    // Filter pills
    const pills = this.mount.querySelectorAll('.crm-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterStatus = pill.getAttribute('data-filter');
        this.render();
      });
    });

    // Search input
    const searchInput = this.mount.querySelector('#crm-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const filtered = this.getFilteredOrders();
        const container = this.mount.querySelector('.crm-orders-grid');
        if (container) {
          container.innerHTML = filtered.length === 0 ? `
            <div class="crm-empty-state">
              <div class="empty-icon">🔍</div>
              <h3>Mos buyurtmalar topilmadi</h3>
            </div>
          ` : filtered.map(o => this.renderOrderCard(o)).join('');
          this.attachCardActionListeners();
        }
      });
    }

    this.attachCardActionListeners();
  }

  attachCardActionListeners() {
    // Approve buttons
    const approveBtns = this.mount.querySelectorAll('[data-approve-id]');
    approveBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-approve-id');
        btn.textContent = 'Tasdiqlanmoqda...';
        await fetch('/api/review-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, action: 'approve' })
        }).catch(() => {});
        await this.fetchOrders();
      });
    });

    // Decline buttons
    const declineBtns = this.mount.querySelectorAll('[data-decline-id]');
    declineBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-decline-id');
        btn.textContent = 'Rad etilmoqda...';
        await fetch('/api/review-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, action: 'decline' })
        }).catch(() => {});
        await this.fetchOrders();
      });
    });

    // Chat open buttons
    const chatBtns = this.mount.querySelectorAll('[data-chat-id]');
    chatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-chat-id');
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
          this.openAdminChat(order);
        }
      });
    });
  }

  async openAdminChat(order) {
    this.activeChatOrder = order;
    await this.fetchChatMessages(order.orderId);
    this.render();

    // Start chat message poller
    if (this.chatPoller) clearInterval(this.chatPoller);
    this.chatPoller = setInterval(async () => {
      if (this.activeChatOrder) {
        await this.fetchChatMessages(this.activeChatOrder.orderId, true);
      }
    }, 2000);

    this.attachChatDrawerListeners();
  }

  async fetchChatMessages(orderId, silent = false) {
    try {
      const res = await fetch(`/api/chat-messages?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        this.chatMessages = data.messages;
        if (!silent) {
          const body = this.mount.querySelector('#adchat-messages-body');
          if (body) {
            body.innerHTML = this.chatMessages.map(m => `
              <div class="chat-bubble ${m.sender === 'admin' ? 'admin' : 'customer'}">
                <div class="bubble-sender">${m.sender === 'admin' ? '👨‍💼 Siz (Admin)' : '👤 ' + (m.senderName || 'Mijoz')}</div>
                <div class="bubble-text">${m.text}</div>
                <div class="bubble-time">${new Date(m.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            `).join('');
            body.scrollTop = body.scrollHeight;
          }
        }
      }
    } catch (e) {}
  }

  attachChatDrawerListeners() {
    const btnClose = this.mount.querySelector('#btn-close-adchat');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.activeChatOrder = null;
        if (this.chatPoller) clearInterval(this.chatPoller);
        const modal = this.mount.querySelector('#admin-chat-modal');
        if (modal) modal.style.display = 'none';
      });
    }

    const inputField = this.mount.querySelector('#adchat-input-field');
    const btnSend = this.mount.querySelector('#btn-adchat-send');

    const sendAction = async () => {
      const text = inputField.value.trim();
      if (!text || !this.activeChatOrder) return;
      inputField.value = '';

      try {
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: this.activeChatOrder.orderId,
            sender: 'admin',
            senderName: 'Any3D Admin',
            text
          })
        });
        await this.fetchChatMessages(this.activeChatOrder.orderId);
      } catch (err) {}
    };

    if (btnSend) btnSend.addEventListener('click', sendAction);
    if (inputField) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAction();
      });
    }

    // Template buttons
    const tplBtns = this.mount.querySelectorAll('.ad-tpl-btn');
    tplBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (inputField) {
          inputField.value = btn.getAttribute('data-tpl');
          inputField.focus();
        }
      });
    });
  }
}