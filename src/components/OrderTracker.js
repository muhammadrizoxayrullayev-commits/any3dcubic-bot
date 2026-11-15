export class OrderTracker {
  constructor(mountElement, initialOrder = null, onBackToConfigurator) {
    this.mount = typeof mountElement === 'string' ? document.querySelector(mountElement) : mountElement;
    this.currentOrder = initialOrder || {
      orderId: '#T3D-UZ-8492',
      customerName: 'Muhammad Rizo',
      customerPhone: '+998 90 123 45 67',
      orderTypeTitle: 'Funktsional va Ehtiyot Qismlar (Oshxona Kombayni Shesternasi)',
      material: 'PETG Mustahkam (Signal Zarg‘aldoq)',
      quantity: 1,
      grandTotal: '75 000 so‘m',
      deliveryMethod: 'yandex',
      deliveryMethodTitle: '🛵 Toshkentda Yandex Dostavka',
      turnaround: 'standard',
      createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };
    this.onBackToConfigurator = onBackToConfigurator;
    this.chatMessages = [];
    this.chatPoller = null;

    this.init();
  }

  async init() {
    this.render();
    await this.fetchMessages();
    this.startChatPoller();
  }

  startChatPoller() {
    if (this.chatPoller) clearInterval(this.chatPoller);
    this.chatPoller = setInterval(async () => {
      await this.fetchMessages(true);
    }, 2500);
  }

  destroy() {
    if (this.chatPoller) clearInterval(this.chatPoller);
  }

  setOrder(orderData) {
    this.currentOrder = orderData;
    this.render();
    this.fetchMessages();
  }

  async fetchMessages(silent = false) {
    const orderId = this.currentOrder.orderId;
    if (!orderId) return;

    try {
      const res = await fetch(`/api/chat-messages?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.messages)) {
        this.chatMessages = data.messages;
        if (!silent) this.updateChatUI();
        else {
          const body = this.mount.querySelector('#cust-chat-messages-body');
          if (body && data.messages.length > 0) {
            body.innerHTML = this.renderChatMessagesHTML();
            body.scrollTop = body.scrollHeight;
          }
        }
      }
    } catch (e) {
      // Fallback from localStorage
      try {
        const local = JSON.parse(localStorage.getItem(`chat_${orderId}`) || '[]');
        if (local.length > 0 && this.chatMessages.length === 0) {
          this.chatMessages = local;
          this.updateChatUI();
        }
      } catch (err) {}
    }
  }

  updateChatUI() {
    const body = this.mount.querySelector('#cust-chat-messages-body');
    if (body) {
      body.innerHTML = this.renderChatMessagesHTML();
      body.scrollTop = body.scrollHeight;
    }
  }

  renderChatMessagesHTML() {
    if (this.chatMessages.length === 0) {
      return `
        <div class="cchat-empty-hint">
          <span class="hint-icon">💬</span>
          <p>Hozircha xabarlar yo‘q. Ustaxona adminlariga buyurtma bo‘yicha har qanday savolingizni yozishingiz mumkin.</p>
        </div>
      `;
    }

    return this.chatMessages.map(m => `
      <div class="cchat-bubble ${m.sender === 'customer' ? 'cust' : 'admin'}">
        <div class="cchat-meta">
          <strong>${m.sender === 'customer' ? '👤 Siz' : '👨‍💼 Any3D Ustaxona Admini'}</strong>
          <span>${new Date(m.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="cchat-content">${m.text}</div>
      </div>
    `).join('');
  }

  render() {
    const delivText = this.currentOrder.deliveryMethodTitle || 
      (this.currentOrder.deliveryMethod === 'bts' ? '📦 Viloyatlarga BTS Pochta (To‘lov qabulda)' 
      : (this.currentOrder.deliveryMethod === 'yandex' ? '🛵 Toshkentda Yandex Dostavka (Kuryerga to‘lanadi)' 
      : '🏬 Ustaxonadan Bepul Olib Ketish'));

    this.mount.innerHTML = `
      <div class="tracker-wrapper">
        <div class="tracker-header">
          <button type="button" class="btn-back-link" id="btn-tracker-back">
            ← Buyurtma Portali va Studiyaga Qaytish
          </button>
          <div class="tracker-title-row">
            <div>
              <div class="step-tag"><span class="step-num">Jonli Kuzatuv</span> Anycubic & Bambu Telemetriyasi</div>
              <h2 class="section-title">Buyurtma Holati va Ustaxona Telemetriyasi</h2>
            </div>
            <div class="tracker-search-box">
              <input type="text" id="track-id-input" value="${this.currentOrder.orderId}" placeholder="Buyurtma #">
              <button type="button" class="btn-track-lookup" id="btn-lookup">Tekshirish</button>
            </div>
          </div>
        </div>

        <!-- Buyurtma Qisqacha Qatori -->
        <div class="tracker-summary-strip">
          <div class="tss-item">
            <span class="tss-lbl">Buyurtma Raqami:</span>
            <strong class="tss-val highlight">${this.currentOrder.orderId}</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Mijoz:</span>
            <strong class="tss-val">${this.currentOrder.customerName}</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Mahsulot:</span>
            <strong class="tss-val">${this.currentOrder.orderTypeTitle}</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Material va Soni:</span>
            <strong class="tss-val">${this.currentOrder.material} (${this.currentOrder.quantity} dona)</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Summasi:</span>
            <strong class="tss-val">${this.currentOrder.grandTotal}</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Yetkazish:</span>
            <strong class="tss-val deliv-highlight">${delivText}</strong>
          </div>
          <div class="tss-item">
            <span class="tss-lbl">Ustaxona:</span>
            <strong class="tss-val">Chilonzor Markazi</strong>
          </div>
        </div>

        <!-- Bosqichlar Zanjiri -->
        <div class="pipeline-card">
          <h3 class="pipeline-heading">Ishlab Chiqarish Jarayoni (Jonli Telemetriya)</h3>

          <div class="timeline-steps">
            <div class="t-step completed">
              <div class="t-circle">✓</div>
              <div class="t-content">
                <h4>1. Buyurtma & To‘lov Cheki Qabul Qilindi</h4>
                <p>${this.currentOrder.receiptImage ? 'To‘lov chekingiz administratorlarimiz tomonidan tekshirilib tasdiqlandi.' : 'Raqamli model tekshirildi va bosmaga yo‘naltirildi.'}</p>
                <span class="t-time">Bajarildi: Bugun</span>
              </div>
            </div>

            <div class="t-step completed">
              <div class="t-circle">✓</div>
              <div class="t-content">
                <h4>2. Anycubic / Bambu Printeri Uchun G-kod Tayyorlandi</h4>
                <p>Slicer dasturida 0.20mm qatlam balandligi va 60% giroid to‘ldirish hisoblandi.</p>
                <span class="t-time">Navbatdagi o‘rni: #1</span>
              </div>
            </div>

            <div class="t-step current">
              <div class="t-circle pulse">⚡</div>
              <div class="t-content">
                <h4>3. Chop Etish Jarayoni Ketmoqda (Chilonzor Ustaxonasi)</h4>
                <p>Anycubic Kobra 2 Pro faol. 320 qatlamdan 214-qatlam bosilmoqda. Sirt sifati a’lo.</p>
                
                <!-- Jonli Telemetriya Qutisi -->
                <div class="telemetry-box">
                  <div class="tel-grid">
                    <div class="tel-metric">
                      <span class="tm-lbl">Soplo Harorati</span>
                      <strong class="tm-val cyan">220°C / 220°C</strong>
                    </div>
                    <div class="tel-metric">
                      <span class="tm-lbl">Stol Harorati</span>
                      <strong class="tm-val orange">60°C / 60°C</strong>
                    </div>
                    <div class="tel-metric">
                      <span class="tm-lbl">Bosish Tezligi</span>
                      <strong class="tm-val green">250 mm/s</strong>
                    </div>
                    <div class="tel-metric">
                      <span class="tm-lbl">Bajarildi</span>
                      <strong class="tm-val highlight">68% Tayyor</strong>
                    </div>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: 68%;"></div>
                  </div>
                  <div class="eta-text">⏱️ Taxminan 28 daqiqada tugaydi</div>
                </div>
              </div>
            </div>

            <div class="t-step future">
              <div class="t-circle">4</div>
              <div class="t-content">
                <h4>4. Sifat Nazorati va Shtangensirkul Tekshiruvi</h4>
                <p>Tishlar qadami va o‘q diametri elektron shtangensirkulda tekshiriladi (±0.05 mm).</p>
                <span class="t-time">Bosma tugagach</span>
              </div>
            </div>

            <div class="t-step future">
              <div class="t-circle">5</div>
              <div class="t-content">
                <h4>5. ${this.currentOrder.deliveryMethod === 'bts' ? 'BTS Pochta Orqali Yuboriladi' : (this.currentOrder.deliveryMethod === 'yandex' ? 'Yandex Go Kuryeriga Topshiriladi' : 'Chilonzor Ustaxonasidan Olib Ketish')}</h4>
                <p>${this.currentOrder.deliveryMethod === 'bts' ? 'Viloyat pochtasiga topshirilib sizga kuzatuv trek-kodi beriladi.' : (this.currentOrder.deliveryMethod === 'yandex' ? 'Yandex Go kuryeri orqali eshigingizgacha yetkaziladi (to‘lov kuryerga).' : 'Himoya qutisiga qadoqlanib tayyor holatda topshiriladi.')}</p>
                <span class="t-time">Bugun 18:30 gacha kutilmoqda</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 💬 BUYURTMA BO'YICHA ADMIN BILAN JONLI CHAT -->
        <div class="customer-order-chat-card">
          <div class="cchat-header">
            <div class="cchat-title-group">
              <span class="cchat-icon">💬</span>
              <div>
                <h4>Ustaxona Administratorlari Bilan Jonli Chat</h4>
                <p>Buyurtma: <strong>${this.currentOrder.orderId}</strong> bo‘yicha savollar va tuzatishlarni bevosita yozing</p>
              </div>
            </div>
            <span class="cchat-live-badge"><span class="cchat-dot"></span> Admin Online</span>
          </div>

          <div class="cchat-messages-container" id="cust-chat-messages-body">
            ${this.renderChatMessagesHTML()}
          </div>

          <!-- Tezkor Savollar Shablonlari -->
          <div class="cchat-suggestions">
            <button type="button" class="csug-btn" data-sug="Qachon tayyor bo‘ladi?">⏱️ Qachon tayyor bo‘ladi?</button>
            <button type="button" class="csug-btn" data-sug="Detal rangini qora qilsak bo‘ladimi?">🎨 Rangini o‘zgartirish</button>
            <button type="button" class="csug-btn" data-sug="Yetkazib berish bo‘yicha manzilimni aniqlashtirmoqchiman">🛵 Yetkazish bo‘yicha</button>
          </div>

          <!-- Xabar Yuborish Maydoni -->
          <div class="cchat-input-bar">
            <input type="text" id="cust-chat-input" placeholder="Adminlarga xabar yozing (masalan: o'lcham, rang, yetkazish)...">
            <button type="button" class="btn-send-cust-msg" id="btn-send-cust-msg">Yuborish 🚀</button>
          </div>
        </div>

        <!-- 📍 LOKATSIYA VA XARITA KARTASI -->
        <div class="workshop-location-card">
          <div class="wlc-left">
            <div class="wlc-badge">📍 Jismoniy Ustaxona Lokatsiyasi</div>
            <h4 class="wlc-title">Any3D Bosma & Prototip Ustaxonasi</h4>
            <p class="wlc-address">🏬 Toshkent shahri, Chilonzor tumani, 9-mavze, 12-bino</p>
            <p class="wlc-landmarks">🎯 Mo‘ljal: Chilonzor metro bekati, Chilonzor savdo markazi yaqinida</p>
            <p class="wlc-hours">⏱️ Ish vaqti: Dushanba – Shanba, 09:00 – 20:00</p>
            <p class="wlc-phone">📞 Telefon: <a href="tel:+998901234567">+998 (90) 123-45-67</a></p>
          </div>

          <div class="wlc-right">
            <span class="wlc-hint">Telefoningizdagi xaritada marshrut chizish:</span>
            <div class="wlc-btn-group">
              <a href="https://www.google.com/maps/dir/?api=1&destination=41.272145,69.204523" target="_blank" class="wlc-map-btn google">
                🗺️ Google Maps'da Ochish
              </a>
              <a href="https://yandex.com/maps/?rtext=~41.272145,69.204523&rtt=auto" target="_blank" class="wlc-map-btn yandex">
                📍 Yandex Maps'da Ochish
              </a>
              <a href="https://maps.apple.com/?daddr=41.272145,69.204523" target="_blank" class="wlc-map-btn apple">
                🍏 Apple Maps (iPhone)
              </a>
              <a href="https://t.me/Any3dCubic_bot" target="_blank" class="wlc-map-btn tg">
                ✈️ Telegram Bot (@Any3dCubic_bot)
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const btnBack = this.mount.querySelector('#btn-tracker-back');
    if (btnBack && this.onBackToConfigurator) {
      btnBack.addEventListener('click', () => {
        this.onBackToConfigurator();
      });
    }

    const btnLookup = this.mount.querySelector('#btn-lookup');
    const inputId = this.mount.querySelector('#track-id-input');
    if (btnLookup && inputId) {
      btnLookup.addEventListener('click', () => {
        const id = inputId.value.trim();
        if (id) {
          this.currentOrder.orderId = id;
          this.render();
          this.fetchMessages();
        }
      });
    }

    // Chat sending
    const chatInput = this.mount.querySelector('#cust-chat-input');
    const sendBtn = this.mount.querySelector('#btn-send-cust-msg');

    const doSend = async () => {
      const text = chatInput?.value?.trim();
      if (!text) return;
      chatInput.value = '';

      const newMsg = {
        orderId: this.currentOrder.orderId,
        sender: 'customer',
        senderName: this.currentOrder.customerName || 'Mijoz',
        text
      };

      try {
        const res = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg)
        });
        if (!res.ok) throw new Error('API unavailable');
        await this.fetchMessages();
      } catch (err) {
        // Fallback: Telegram Bot API orqali to'g'ridan-to'g'ri adminlarga yetkazish
        const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const adminIds = (import.meta.env.VITE_ADMIN_CHAT_IDS || '6541554878,8929216064').split(',').map(s => s.trim());
        if (botToken) {
          const directMsg = `
💬 <b>MIJOZDAN JONLI CHAT XABARI (Zaxira Kanal)!</b>

🆔 <b>Buyurtma ID:</b> <code>${this.currentOrder.orderId}</code>
👤 <b>Mijoz:</b> ${this.currentOrder.customerName || 'Mijoz'} (${this.currentOrder.customerPhone || 'Tel yo‘q'})
✉️ <b>Xabar:</b> "${text}"
📅 <b>Vaqt:</b> ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          `.trim();

          for (const aid of adminIds) {
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: aid,
                text: directMsg,
                parse_mode: 'HTML'
              })
            }).catch(() => {});
          }
        }

        // Local saving
        this.chatMessages.push({
          ...newMsg,
          id: 'local_' + Date.now(),
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(`chat_${this.currentOrder.orderId}`, JSON.stringify(this.chatMessages));
        this.updateChatUI();
      }
    };

    if (sendBtn) sendBtn.addEventListener('click', doSend);
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSend();
      });
    }

    // Quick suggestions
    const sugBtns = this.mount.querySelectorAll('.csug-btn');
    sugBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (chatInput) {
          chatInput.value = btn.getAttribute('data-sug');
          chatInput.focus();
        }
      });
    });
  }
}