import { ORDER_TYPES, MATERIALS, QUALITY_PRESETS, INFILL_PRESETS, EXCHANGE_RATE_UZS_PER_USD } from '../data/orderTypes.js';
import confetti from 'canvas-confetti';

export class OrderConfigurator {
  constructor(mountElement, threeStudio, onOrderSubmitted) {
    this.mount = mountElement;
    this.studio = threeStudio;
    this.onOrderSubmitted = onOrderSubmitted;

    // Boshlang'ich holat
    this.state = {
      orderTypeId: 'functional-part',
      presetIndex: 0,
      materialId: 'PETG',
      colorHex: '#ff6600',
      infill: 60,
      layerHeight: '0.20',
      quantity: 1,
      modelingService: 'none', // 'none', 'broken-part', 'sketch'
      turnaround: 'standard', // 'standard', 'rush24'
      delivery: 'pickup', // 'pickup', 'yandex'
      isStudent: false,
      studentId: '',
      currency: 'UZS',
      customerName: '',
      customerPhone: '+998 ',
      customerTelegram: '',
      orderNotes: '',
      uploadedFileName: null,
      receiptImage: null,
      slicePercent: 100,
      wireframe: false
    };

    this.render();
  }

  getCurrentOrderType() {
    return ORDER_TYPES.find(t => t.id === this.state.orderTypeId) || ORDER_TYPES[0];
  }

  getCurrentMaterial() {
    return MATERIALS.find(m => m.id === this.state.materialId) || MATERIALS[0];
  }

  formatPrice(uzs) {
    if (this.state.currency === 'USD') {
      const usd = (uzs / EXCHANGE_RATE_UZS_PER_USD).toFixed(2);
      return `$${usd}`;
    }
    return `${uzs.toLocaleString('ru-RU')} so‘m`;
  }

  calculatePricing() {
    const orderType = this.getCurrentOrderType();
    const material = this.getCurrentMaterial();
    const currentPreset = orderType.presets[this.state.presetIndex] || orderType.presets[0];
    const quality = QUALITY_PRESETS.find(q => q.id === this.state.layerHeight) || QUALITY_PRESETS[1];

    const infillFactor = 0.5 + (this.state.infill / 100) * 0.7;
    const estWeightG = Math.round(currentPreset.weightG * infillFactor);
    const rawMaterialCost = estWeightG * material.costPerGUZS;
    const estTimeHrs = +(currentPreset.timeHrs * quality.speedMultiplier * infillFactor).toFixed(1);
    const machineDepreciationAndElec = Math.round(estTimeHrs * 2665);
    const finishingCost = 12000;

    let designFee = 0;
    if (this.state.modelingService === 'broken-part') {
      designFee = currentPreset.modelingFeeUZS || 80000;
    } else if (this.state.modelingService === 'sketch') {
      designFee = 50000;
    }

    const directUnitCost = rawMaterialCost + machineDepreciationAndElec + finishingCost;
    const baseUnitPrice = Math.max(
      orderType.basePriceUZS,
      Math.round((directUnitCost * 2.3) / 5000) * 5000
    );

    let volumeDiscountPercent = 0;
    if (this.state.quantity >= 50) volumeDiscountPercent = 35;
    else if (this.state.quantity >= 25) volumeDiscountPercent = 25;
    else if (this.state.quantity >= 10) volumeDiscountPercent = 15;

    const unitPriceAfterVolume = Math.round(baseUnitPrice * (1 - volumeDiscountPercent / 100));
    let partsSubtotal = unitPriceAfterVolume * this.state.quantity;

    let rushSurcharge = 0;
    if (this.state.turnaround === 'rush24') {
      rushSurcharge = Math.round(partsSubtotal * 0.25);
    }

    let studentDiscount = 0;
    if (this.state.isStudent) {
      studentDiscount = Math.round(partsSubtotal * 0.20);
    }

    // Yetkazib berish narxi sayt hisobiga qo'shilmaydi (Mijoz bevosita kuryer yoki pochtaga to'laydi)
    const deliveryFee = 0;
    const grandTotalUZS = Math.max(0, partsSubtotal + designFee + rushSurcharge - studentDiscount);

    return {
      estWeightG,
      estTimeHrs,
      rawMaterialCost,
      directUnitCost,
      baseUnitPrice,
      unitPriceAfterVolume,
      volumeDiscountPercent,
      partsSubtotal,
      designFee,
      rushSurcharge,
      studentDiscount,
      deliveryFee,
      grandTotalUZS
    };
  }

  setCurrency(curr) {
    this.state.currency = curr;
    this.render();
  }

  selectOrderType(typeId) {
    this.state.orderTypeId = typeId;
    this.state.presetIndex = 0;
    const orderType = this.getCurrentOrderType();

    this.state.materialId = orderType.recommendedMaterial.startsWith('PLA') ? 'PLA' : orderType.recommendedMaterial;
    if (orderType.recommendedMaterial === 'PLA-SILK') this.state.materialId = 'PLA-SILK';
    if (orderType.recommendedMaterial === 'ABS-P1S') this.state.materialId = 'ABS-P1S';

    this.state.infill = orderType.defaultInfill;
    this.state.layerHeight = orderType.defaultLayerHeight.toFixed(2);
    this.state.quantity = orderType.defaultQuantity;

    if (typeId === 'educational-project') {
      this.state.isStudent = true;
    }

    if (this.studio) {
      this.studio.loadModelPreset(orderType.modelPreset);
      const mat = this.getCurrentMaterial();
      this.state.colorHex = mat.colors[0].hex;
      this.studio.setMaterialType(this.state.materialId);
      this.studio.setColor(this.state.colorHex);
    }

    this.render();
  }

  render() {
    const currentType = this.getCurrentOrderType();
    const currentMat = this.getCurrentMaterial();
    const pricing = this.calculatePricing();

    this.mount.innerHTML = `
      <div class="configurator-wrapper">
        <!-- 1-Qadam: Buyurtma Turini Tanlash -->
        <section class="section-block" id="order-type-selection">
          <div class="section-header">
            <div class="step-tag"><span class="step-num">1-Qadam</span> Buyurtma Turini Tanlang</div>
            <h2 class="section-title">Sizga qanday 3D bosma xizmati kerak?</h2>
            <p class="section-subtitle">Toshkentdagi ehtiyojingizga mos maxsus materiallar, muhandislik parametrlari va shaffof narxlar.</p>
          </div>

          <div class="order-type-grid" id="order-types-container">
            ${ORDER_TYPES.map(type => `
              <div class="order-type-card ${type.id === this.state.orderTypeId ? 'active' : ''}" data-type-id="${type.id}">
                <div class="card-top-row">
                  <span class="type-icon">${type.icon}</span>
                  <span class="type-badge badge-${type.badgeColor}">${type.badge}</span>
                </div>
                <h3 class="type-title">${type.title}</h3>
                <div class="type-uz">${type.uzTitle}</div>
                <p class="type-desc">${type.shortDesc}</p>
                <div class="type-footer">
                  <div class="type-price">Boshlang‘ich: <strong>${this.formatPrice(type.basePriceUZS)}</strong></div>
                  <div class="type-turnaround">⏱️ ${type.typicalTurnaround}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Asosiy Ish Maydoni: Chapda Sozlamalar, O'ngda 3D Studio -->
        <div class="workspace-grid">
          <!-- Chap Ustun: Parametrlarni Sozlash -->
          <div class="specs-panel">
            <div class="panel-header">
              <div class="step-tag"><span class="step-num">2-Qadam</span> Parametrlarni Sozlang</div>
              <h3 class="panel-title">${currentType.icon} ${currentType.title}</h3>
            </div>

            <!-- Namunaviy Buyumlar -->
            <div class="form-group">
              <label class="group-label">Namunaviy Buyum Shabloni</label>
              <div class="preset-pill-row">
                ${currentType.presets.map((preset, idx) => `
                  <button type="button" class="preset-pill ${idx === this.state.presetIndex ? 'active' : ''}" data-preset-idx="${idx}">
                    ${preset.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Material Tanlash -->
            <div class="form-group">
              <div class="label-row">
                <label class="group-label">Material va Polimer Turi</label>
                <span class="spec-info-badge">${currentMat.type}</span>
              </div>
              <div class="material-card-row">
                ${MATERIALS.map(m => `
                  <div class="material-chip ${m.id === this.state.materialId ? 'active' : ''}" data-mat-id="${m.id}">
                    <div class="mat-name">${m.name.split(' (')[0]}</div>
                    <div class="mat-prop">${m.bestFor.split(',')[0]}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Rang Tanlash -->
            <div class="form-group">
              <label class="group-label">Filament Rangi (3D Modeldan Ko‘ring)</label>
              <div class="color-picker-row">
                ${currentMat.colors.map(c => `
                  <button type="button" class="color-dot ${c.hex === this.state.colorHex ? 'active' : ''}" 
                          data-color="${c.hex}" 
                          style="background-color: ${c.hex};" 
                          title="${c.name}">
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Zichlik va Qatlam Qalinligi -->
            <div class="form-row-dual">
              <div class="form-group">
                <div class="label-row">
                  <label class="group-label">Ichki Zichlik (Infill)</label>
                  <span class="value-highlight">${this.state.infill}%</span>
                </div>
                <div class="segmented-control">
                  ${INFILL_PRESETS.map(inf => `
                    <button type="button" class="segment-btn ${inf.value === this.state.infill ? 'active' : ''}" data-infill="${inf.value}">
                      ${inf.value}%
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="group-label">Qatlam Qalinligi (Aniqlik)</label>
                  <span class="value-highlight">${this.state.layerHeight} mm</span>
                </div>
                <div class="segmented-control">
                  ${QUALITY_PRESETS.map(q => `
                    <button type="button" class="segment-btn ${q.id === this.state.layerHeight ? 'active' : ''}" data-layer="${q.id}">
                      ${q.id}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 3D Chizma / Revers-Injiniring Xizmati -->
            <div class="form-group">
              <label class="group-label">3D Chizma va Fayl Tayyorlash Xizmati</label>
              <div class="radio-option-list">
                <label class="radio-card ${this.state.modelingService === 'none' ? 'active' : ''}">
                  <input type="radio" name="modeling" value="none" ${this.state.modelingService === 'none' ? 'checked' : ''}>
                  <div class="radio-content">
                    <div class="radio-title">Menda 3D Fayl Bor (.STL, .STEP, .OBJ)</div>
                    <div class="radio-desc">Faylni bosmaga tayyorlash va geometriyasini tekshirish bepul</div>
                  </div>
                  <span class="fee-tag free">Bepul</span>
                </label>

                <label class="radio-card ${this.state.modelingService === 'broken-part' ? 'active' : ''}">
                  <input type="radio" name="modeling" value="broken-part" ${this.state.modelingService === 'broken-part' ? 'checked' : ''}>
                  <div class="radio-content">
                    <div class="radio-title">Singan Detaldan Qayta Chizma Tayyorlash</div>
                    <div class="radio-desc">Singan namunani Chilonzorga olib keling yoki fotosuratlarni yuboring</div>
                  </div>
                  <span class="fee-tag">+${this.formatPrice(currentType.presets[this.state.presetIndex]?.modelingFeeUZS || 80000)}</span>
                </label>

                <label class="radio-card ${this.state.modelingService === 'sketch' ? 'active' : ''}">
                  <input type="radio" name="modeling" value="sketch" ${this.state.modelingService === 'sketch' ? 'checked' : ''}>
                  <div class="radio-content">
                    <div class="radio-title">Qog‘ozdagi Eskiz / O‘lchamlardan 3D Chizish</div>
                    <div class="radio-desc">Chizilgan o‘lchamlarni kompyuterda aniq 3D shaklga aylantiramiz</div>
                  </div>
                  <span class="fee-tag">+${this.formatPrice(50000)}</span>
                </label>
              </div>
            </div>

            <!-- Soni va Ulgurji Chegirma -->
            <div class="form-group">
              <div class="label-row">
                <label class="group-label">Buyurtma Soni (Dona)</label>
                <div class="qty-counter">
                  <button type="button" class="qty-btn" id="btn-qty-minus">-</button>
                  <span class="qty-num">${this.state.quantity}</span>
                  <button type="button" class="qty-btn" id="btn-qty-plus">+</button>
                </div>
              </div>
              <input type="range" class="custom-slider" id="qty-slider" min="1" max="100" value="${this.state.quantity}">
              <div class="discount-pills">
                <span class="disc-pill ${this.state.quantity >= 10 && this.state.quantity < 25 ? 'highlight' : ''}">10+ dona: -15%</span>
                <span class="disc-pill ${this.state.quantity >= 25 && this.state.quantity < 50 ? 'highlight' : ''}">25+ dona: -25%</span>
                <span class="disc-pill ${this.state.quantity >= 50 ? 'highlight' : ''}">50+ dona: -35% B2B</span>
              </div>
            </div>

            <!-- Talaba Chegirmasi va Tezkor Navbat -->
            <div class="form-row-dual">
              <div class="checkbox-box ${this.state.isStudent ? 'active' : ''}">
                <label class="checkbox-label">
                  <input type="checkbox" id="student-toggle" ${this.state.isStudent ? 'checked' : ''}>
                  <div>
                    <div class="check-title">🎓 Talaba Chegirmasi (-20%)</div>
                    <div class="check-sub">ToshTech, TATU, Turin va boshqalar</div>
                  </div>
                </label>
              </div>

              <div class="checkbox-box ${this.state.turnaround === 'rush24' ? 'active' : ''}">
                <label class="checkbox-label">
                  <input type="checkbox" id="rush-toggle" ${this.state.turnaround === 'rush24' ? 'checked' : ''}>
                  <div>
                    <div class="check-title">⚡ Ekspress VIP 24 Soat</div>
                    <div class="check-sub">+25% navbatsiz zudlik bilan</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Qabul Qilish va Yetkazib Berish -->
            <div class="form-group">
              <div class="group-header-row">
                <label class="group-label">Yetkazib Berish va Qabul Qilish Usuli</label>
                <span class="delivery-badge-note">💡 Kuryerga / Pochtaga to‘lanadi</span>
              </div>
              <div class="delivery-segmented-3">
                <button type="button" class="deliv-card-btn ${this.state.delivery === 'pickup' ? 'active' : ''}" data-delivery="pickup">
                  <span class="deliv-icon">🏬</span>
                  <div class="deliv-meta">
                    <strong>Ustaxonadan Olib Ketish</strong>
                    <small>Chilonzor markazimizdan bepul</small>
                  </div>
                </button>
                <button type="button" class="deliv-card-btn ${this.state.delivery === 'yandex' ? 'active' : ''}" data-delivery="yandex">
                  <span class="deliv-icon">🛵</span>
                  <div class="deliv-meta">
                    <strong>Toshkent Ichida (Yandex)</strong>
                    <small>Yandex Go (Kuryerga to‘lanadi)</small>
                  </div>
                </button>
                <button type="button" class="deliv-card-btn ${this.state.delivery === 'bts' ? 'active' : ''}" data-delivery="bts">
                  <span class="deliv-icon">📦</span>
                  <div class="deliv-meta">
                    <strong>Viloyatlarga (BTS Pochta)</strong>
                    <small>BTS / EMU (Pochtaga to‘lanadi)</small>
                  </div>
                </button>
              </div>

              <div class="delivery-notice-box">
                ${this.state.delivery === 'bts' 
                  ? '📦 <b>Viloyatlar bo‘ylab yetkazish:</b> Toshkentdan viloyatingizga BTS Pochta yoki EMU orqali 24 soat ichida yuboriladi. Pochta xarajati qabul qilib olinganda to‘lanadi (saytdagi hisobga qo‘shilmaydi).'
                  : (this.state.delivery === 'yandex'
                    ? '🛵 <b>Toshkent shahri bo‘ylab yetkazish:</b> Buyurtmangiz tayyor bo‘lgach Yandex Dostavka orqali manzilingizga tezkor jo‘natiladi. Yetkazib berish xarajati kuryerga qabul qilinganda to‘lanadi.'
                    : '📍 <b>Ustaxonamizdan bepul olib ketish:</b> Buyurtmangiz tayyor bo‘lishi bilan Chilonzor ustaxonamizdan bepul olib ketishingiz mumkin. Manzil: Chilonzor 9-mavze.')
                }
              </div>
            </div>
          </div>

          <!-- O'ng Ustun: 3D Interaktiv Studio va Slicer -->
          <div class="viewport-panel">
            <div class="viewport-header">
              <div class="viewport-title-group">
                <span class="live-dot"></span>
                <h4 class="viewport-heading">Interaktiv 3D Studio (Bambu Lab 256mm Stol)</h4>
              </div>
              <div class="viewport-tools">
                <button type="button" class="tool-btn ${this.state.wireframe ? 'active' : ''}" id="btn-toggle-wire" title="CAD To‘r Ko‘rinishi">
                  🕸️ To‘r
                </button>
                <button type="button" class="tool-btn" id="btn-reset-cam" title="Kamerani Tiklash">
                  🔄 Markazga
                </button>
                <label class="tool-btn upload-btn" title="O‘z .STL faylingizni yuklang">
                  📁 .STL Yuklash
                  <input type="file" id="stl-file-input" accept=".stl,.obj" style="display:none;">
                </label>
              </div>
            </div>

            <!-- 3D Canvas -->
            <div class="three-canvas-frame" id="three-viewport-mount"></div>

            <!-- Slicer Simulyatsiyasi -->
            <div class="slicer-control-bar">
              <div class="slicer-info">
                <span class="slicer-label">🖨️ Qatlamlar Slicer Simulyatsiyasi:</span>
                <span class="slicer-val" id="slice-val-text">${this.state.slicePercent}%</span>
              </div>
              <input type="range" class="slicer-slider" id="slicer-slider" min="5" max="100" value="${this.state.slicePercent}">
              <div class="slicer-stats">
                <span>Vazni: ~<strong>${pricing.estWeightG * this.state.quantity} gramm</strong></span>
                <span>Vaqti: ~<strong>${(pricing.estTimeHrs * this.state.quantity).toFixed(1)} soat</strong></span>
                <span>Qatlamlar: ~<strong>${Math.round(pricing.estTimeHrs * 120)}</strong></span>
              </div>
            </div>

            <!-- Shaffof Narx Hisob-Kitob Kartasi -->
            <div class="pricing-summary-card">
              <div class="pricing-card-header">
                <div class="quote-tag">Rasmiy Tezkor Hisob-Kitob</div>
                <div class="pricing-rule-formula">
                  Qoida: <code>Narx = Xomashyo + Dastgoh Vaqti + Chizma + Qayta Ishlash + Marja</code>
                </div>
              </div>

              <div class="pricing-rows">
                <div class="price-row">
                  <span>Mahsulotni Chop Etish (${this.state.quantity} × ${this.formatPrice(pricing.unitPriceAfterVolume)})</span>
                  <span>${this.formatPrice(pricing.partsSubtotal)}</span>
                </div>
                ${pricing.volumeDiscountPercent > 0 ? `
                  <div class="price-row discount-row">
                    <span>Ulgurji Chegirma (${pricing.volumeDiscountPercent}%)</span>
                    <span>-${pricing.volumeDiscountPercent}% Qo‘llandi</span>
                  </div>
                ` : ''}
                ${pricing.designFee > 0 ? `
                  <div class="price-row">
                    <span>3D Muhandislik Chizmasi</span>
                    <span>+${this.formatPrice(pricing.designFee)}</span>
                  </div>
                ` : ''}
                ${pricing.rushSurcharge > 0 ? `
                  <div class="price-row">
                    <span>Ekspress VIP 24 Soatlik Navbat</span>
                    <span>+${this.formatPrice(pricing.rushSurcharge)}</span>
                  </div>
                ` : ''}
                ${pricing.studentDiscount > 0 ? `
                  <div class="price-row student-discount-row">
                    <span>🎓 Talaba Chegirmasi (-20%)</span>
                    <span class="neg-price">-${this.formatPrice(pricing.studentDiscount)}</span>
                  </div>
                ` : ''}
                ${pricing.deliveryFee > 0 ? `
                  <div class="price-row">
                    <span>Yandex Go Kuryer Xizmati</span>
                    <span>+${this.formatPrice(pricing.deliveryFee)}</span>
                  </div>
                ` : ''}
              </div>

              <div class="grand-total-row">
                <div class="total-label-group">
                  <span class="total-label">Jami To‘lov:</span>
                  <span class="approx-usd">Taqriban ${(pricing.grandTotalUZS / EXCHANGE_RATE_UZS_PER_USD).toFixed(2)} USD</span>
                </div>
                <div class="total-amount">${this.formatPrice(pricing.grandTotalUZS)}</div>
              </div>

              <!-- Buyurtma Tugmalari -->
              <div class="order-action-buttons">
                <button type="button" class="btn-primary-order" id="btn-submit-order-flow">
                  🚀 Hisob-faktura Chiqarish va Buyurtma Berish
                </button>
                <button type="button" class="btn-secondary-telegram" id="btn-direct-telegram">
                  ✈️ Telegram Orqali Buyurtma
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Buyurtma Modali (Hisob-faktura) -->
        <div class="order-modal-backdrop" id="order-modal" style="display: none;">
          <div class="order-modal-card">
            <button type="button" class="modal-close-btn" id="modal-close">&times;</button>
            <div class="modal-header">
              <div class="success-icon-badge">✅</div>
              <h3 class="modal-title">Buyurtmani Ishga Tushirishga Tayyormiz</h3>
              <p class="modal-desc">Buyurtma parametrlarini tasdiqlang va Chilonzor ustaxonamiz navbatiga qo‘shing.</p>
            </div>

            <div class="modal-body">
              <div class="order-invoice-preview" id="invoice-printable-area">
                <div class="invoice-top">
                  <div>
                    <h4 class="invoice-company">Toshkent 3D Bosma va Prototip Ustaxonasi</h4>
                    <div class="invoice-district">Chilonzor tumani, Toshkent shahri | Tel: +998 (90) 123-45-67</div>
                  </div>
                  <div class="invoice-meta">
                    <div class="order-num" id="inv-order-num">#T3D-UZ-8492</div>
                    <div class="order-date">${new Date().toLocaleDateString('uz-UZ')}</div>
                  </div>
                </div>

                <div class="invoice-details-grid">
                  <div class="inv-col">
                    <span class="inv-k">Buyurtma Turi:</span>
                    <strong class="inv-v">${currentType.title}</strong>
                  </div>
                  <div class="inv-col">
                    <span class="inv-k">Material:</span>
                    <strong class="inv-v">${currentMat.name}</strong>
                  </div>
                  <div class="inv-col">
                    <span class="inv-k">Zichlik va Qatlam:</span>
                    <strong class="inv-v">${this.state.infill}% Zichlik | ${this.state.layerHeight}mm</strong>
                  </div>
                  <div class="inv-col">
                    <span class="inv-k">Soni:</span>
                    <strong class="inv-v">${this.state.quantity} dona</strong>
                  </div>
                  <div class="inv-col">
                    <span class="inv-k">Taxminiy Vazni:</span>
                    <strong class="inv-v">${pricing.estWeightG * this.state.quantity} gramm</strong>
                  </div>
                  <div class="inv-col">
                    <span class="inv-k">Tayyor Bo‘lish Vaqti:</span>
                    <strong class="inv-v">${this.state.turnaround === 'rush24' ? '⚡ Ekspress 24 Soat' : '48 Soat Standart'}</strong>
                  </div>
                </div>

                <div class="invoice-total-box">
                  <span>Jami To‘lanadigan Summa:</span>
                  <strong class="inv-sum">${this.formatPrice(pricing.grandTotalUZS)}</strong>
                </div>
              </div>

              <!-- Mijoz Ma'lumotlari Formasi -->
              <form class="order-checkout-form" id="checkout-form" onsubmit="return false;">
                <div class="form-row-dual">
                  <div class="form-field">
                    <label>Ism va Familiyangiz *</label>
                    <input type="text" id="cust-name" placeholder="Muhammad Rizo" required value="${this.state.customerName}">
                  </div>
                  <div class="form-field">
                    <label>Telefon Raqamingiz *</label>
                    <input type="tel" id="cust-phone" placeholder="+998 90 123 45 67" required value="${this.state.customerPhone}">
                  </div>
                </div>

                <div class="form-row-dual">
                  <div class="form-field">
                    <label>Telegram Username (Ixtiyoriy)</label>
                    <input type="text" id="cust-tg" placeholder="@username" value="${this.state.customerTelegram}">
                  </div>
                  <div class="form-field">
                    <label>Yetkazib Berish Manzili</label>
                    <input type="text" id="cust-addr" placeholder="Chilonzor 9-kvartal yoki Olib ketish">
                  </div>
                </div>

                <div class="form-field">
                  <label>Qo‘shimcha Izoh / Singan Detal Tavsifi</label>
                  <textarea id="cust-notes" rows="2" placeholder="Masalan: Oshxona mikserining singan shesternasi, issiqqa chidamli bo‘lishi lozim">${this.state.orderNotes}</textarea>
                </div>

                <!-- To'lov Karta va Chek Yuklash Maydoni -->
                <div class="payment-upload-card">
                  <div class="payment-card-header">
                    <span class="pay-badge">💳 To‘lov Usuli & Kvitansiya</span>
                    <h4 class="pay-title">To‘lov qiling va chek skrinshotini yuklang</h4>
                    <p class="pay-desc">Buyurtmangiz zudlik bilan navbatga qo‘yilishi uchun Click, Payme yoki karta orqali to‘lov chekini yuklang:</p>
                  </div>

                  <div class="card-details-box">
                    <div class="card-top-info">
                      <span class="card-brand">HUMO • UZCARD • CLICK • PAYME</span>
                      <button type="button" class="btn-copy-card" id="btn-copy-card">📋 Karta Raqamini Nusxalash</button>
                    </div>
                    <div class="card-number-display" id="card-num-text">8600 4904 8219 7750</div>
                    <div class="card-holder-name">Any3D Ustaxonasi (Muhammad Rizo X.)</div>
                  </div>

                  <!-- Chek yuklash maydoni -->
                  <div class="receipt-dropzone-wrapper">
                    <input type="file" id="receipt-file-input" accept="image/*" style="display: none;">
                    
                    <div class="receipt-prompt-area" id="receipt-prompt-area">
                      <div class="receipt-icon">📸</div>
                      <div class="receipt-text-bold">To‘lov cheki yoki skrinshotini yuklang</div>
                      <div class="receipt-text-muted">Click, Payme yoki bank chekining rasmini biriktiring</div>
                      <button type="button" class="btn-select-receipt" id="btn-select-receipt">
                        📁 Chek Rasmini Tanlash
                      </button>
                    </div>

                    <div class="receipt-preview-area" id="receipt-preview-area" style="display: none;">
                      <img id="receipt-img-preview" src="" alt="To'lov cheki">
                      <div class="receipt-preview-info">
                        <span class="receipt-badge-ok">✅ Chek biriktirildi</span>
                        <button type="button" class="btn-clear-receipt" id="btn-clear-receipt">✕ Boshqa rasm tanlash</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="modal-actions">
                  <button type="submit" class="btn-confirm-order" id="btn-final-confirm">
                    🚀 Buyurtmani Tasdiqlash va Yuborish
                  </button>
                  <button type="button" class="btn-print-invoice" id="btn-print-inv">
                    🖨️ PDF / Chekni Chop Etish
                  </button>
                </div>
              </form>

              <!-- 1. Administratorlar Tekshiruvi Ekrani (Verifying) -->
              <div class="order-verifying-card" id="order-verifying-screen" style="display: none;">
                <div class="verifying-radar-anim">
                  <div class="radar-ping"></div>
                  <div class="radar-core">🔍</div>
                </div>
                <div class="verifying-status-badge">🟡 ADMIN TEKSHIRUVI KUTILMOQDA</div>
                <h2 class="verifying-title">To‘lov chekingiz tekshirilmoqda...</h2>
                <div class="success-order-badge" id="verifying-order-num">#T3D-UZ-8492</div>
                
                <p class="verifying-desc">
                  Buyurtmangiz va to‘lov chekingiz Toshkent 3D Ustaxonasi administratorlariga yetkazildi. 
                  <b>Soxta (fake) to‘lovlarning oldini olish</b> maqsadida har bir chek xodimlarimiz tomonidan bank hisobimiz orqali tekshiriladi.
                </p>

                <div class="verifying-tip-box" style="margin: 10px 0; padding: 10px 12px; background: rgba(255, 170, 0, 0.08); border: 1px dashed rgba(255, 170, 0, 0.4); border-radius: 8px; font-size: 12.5px; color: #fbbf24; text-align: left;">
                  ℹ️ Shuningdek, Telegram botimizda (<a href="https://t.me/Any3dCubic_bot" target="_blank" style="color: #fbbf24; font-weight: bold; text-decoration: underline;">@Any3dCubic_bot</a>) buyurtmangiz raqamini yozib, holatni tekshirib turishingiz mumkin.
                </div>

                <div class="verification-steps-card">
                  <div class="vstep completed">
                    <div class="vstep-icon">✅</div>
                    <div class="vstep-info">
                      <strong>1. Chek va buyurtma yuborildi</strong>
                      <span>Telegram orqali adminlarga yetkazildi</span>
                    </div>
                  </div>
                  <div class="vstep active">
                    <div class="vstep-icon pulse">🟡</div>
                    <div class="vstep-info">
                      <strong>2. Admin tasdig‘i</strong>
                      <span id="vstep-admin-text">Hozirda chek haqiqiyligi tekshirilmoqda...</span>
                    </div>
                  </div>
                  <div class="vstep pending">
                    <div class="vstep-icon">🖨️</div>
                    <div class="vstep-info">
                      <strong>3. Dastgohda 3D chop etish</strong>
                      <span>Tasdiqlangandan so‘ng navbatga qo‘yiladi</span>
                    </div>
                  </div>
                </div>

                <div class="verifying-sub-note">
                  ⚡ <i>Odatda tekshiruv 1-3 daqiqa davom etadi. Administrator tasdiqlagan zahoti ekran avtomatik yangilanadi.</i>
                </div>
              </div>

              <!-- 2. Tasdiqlangan va Muvaffaqiyatli Qabul Qilindi Ekrani (Approved) -->
              <div class="order-success-card" id="order-success-screen" style="display: none;">
                <div class="success-icon-anim">🎉</div>
                <div class="approved-status-badge">✅ TO‘LOV TASDIQLANDI</div>
                <h2 class="success-title">Buyurtmangiz qabul qilindi!</h2>
                <div class="success-order-badge" id="success-order-num">#T3D-UZ-8492</div>
                <p class="success-sub">
                  To‘lov chekingiz administratorlarimiz tomonidan tekshirildi va haqiqiyligi tasdiqlandi. Buyurtmangiz Toshkent ustaxonamiz 3D dastgohida chop etishga tayyorlanmoqda!
                </p>
                
                <div class="live-bot-banner">
                  <span class="live-dot-pulse"></span>
                  <div class="live-banner-text">
                    <strong>Buyurtmangizni botda LIVE (jonli) ko‘ra olasiz!</strong>
                    <span>Dastgoh harorati, chop etish tezligi va tayyor bo‘lish vaqti real vaqtda yangilanadi.</span>
                  </div>
                </div>

                <div class="order-telegram-tip-box" id="success-tg-tip" style="margin: 14px 0 16px; padding: 12px 14px; background: rgba(0, 240, 255, 0.08); border: 1px dashed rgba(0, 240, 255, 0.4); border-radius: 10px; text-align: left; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
                  💡 <b>Mijozlar uchun qulaylik:</b> Telegram botimizda (<a href="https://t.me/Any3dCubic_bot" target="_blank" style="color: #00f0ff; font-weight: bold;">@Any3dCubic_bot</a>) shunchaki buyurtma raqamingizni (masalan: <b id="tip-order-digits" style="color: #00f0ff;">5452</b>) yuborsangiz, bot sizga to‘lov chekingiz, buyurtma kartangiz va tayyorlanish jarayonini bir zumda chiqarib beradi!
                </div>

                <div class="success-btn-group">
                  <button type="button" class="btn-success-tracker" id="btn-goto-tracker">
                    📦 Jonli Telemetriyani Ko‘rish (Saytda)
                  </button>
                  <a href="https://t.me/Any3dCubic_bot?start=live" target="_blank" class="btn-success-tg" id="btn-goto-bot">
                    🤖 Botda Live Ko‘rish (@Any3dCubic_bot)
                  </a>
                </div>
              </div>

              <!-- 3. Rad Etilgan Ekrani (Declined / Fake Check) -->
              <div class="order-declined-card" id="order-declined-screen" style="display: none;">
                <div class="declined-icon-anim">❌</div>
                <div class="declined-status-badge">🚫 BUYURTMA RAD ETILDI</div>
                <h2 class="declined-title">Buyurtmangiz atkaz qilindi</h2>
                <div class="declined-order-badge" id="declined-order-num">#T3D-UZ-8492</div>
                
                <div class="declined-reason-box">
                  <div class="reason-header">⚠️ To‘lov cheki tasdiqlanmadi</div>
                  <p class="reason-desc">
                    Yuborilgan to‘lov cheki soxta (fake) deb topildi yoki bank hisobimizga mablag‘ kelib tushmadi. Administratorlar ushbu buyurtmani qabul qilmadi.
                  </p>
                </div>

                <p class="declined-instruction">
                  Agar xatolik yuz bergan bo‘lsa, iltimos haqiqiy to‘lov skrinshotini qayta yuklang yoki bevosita ustaxona administratori bilan bog‘laning.
                </p>

                <div class="declined-btn-group">
                  <button type="button" class="btn-reupload-receipt" id="btn-reupload-receipt">
                    🔄 Qayta Haqiqiy Chek Yuklash
                  </button>
                  <a href="https://t.me/any3DCubicc" target="_blank" class="btn-contact-admin" id="btn-contact-admin">
                    💬 Bosh administrator bilan bog‘lanish (@any3DCubicc)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const threeMount = this.mount.querySelector('#three-viewport-mount');
    if (threeMount && this.studio && this.studio.renderer) {
      threeMount.appendChild(this.studio.renderer.domElement);
      this.studio.onResize();
    }

    this.attachEventListeners();
  }

  attachEventListeners() {
    const cards = this.mount.querySelectorAll('.order-type-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const typeId = card.getAttribute('data-type-id');
        this.selectOrderType(typeId);
      });
    });

    const presetPills = this.mount.querySelectorAll('.preset-pill');
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.state.presetIndex = parseInt(pill.getAttribute('data-preset-idx'), 10);
        this.render();
      });
    });

    const matChips = this.mount.querySelectorAll('.material-chip');
    matChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const matId = chip.getAttribute('data-mat-id');
        this.state.materialId = matId;
        const mat = this.getCurrentMaterial();
        this.state.colorHex = mat.colors[0].hex;
        if (this.studio) {
          this.studio.setMaterialType(matId);
          this.studio.setColor(this.state.colorHex);
        }
        this.render();
      });
    });

    const colorDots = this.mount.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const hex = dot.getAttribute('data-color');
        this.state.colorHex = hex;
        if (this.studio) {
          this.studio.setColor(hex);
        }
        this.render();
      });
    });

    const infillBtns = this.mount.querySelectorAll('[data-infill]');
    infillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.infill = parseInt(btn.getAttribute('data-infill'), 10);
        this.render();
      });
    });

    const layerBtns = this.mount.querySelectorAll('[data-layer]');
    layerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.layerHeight = btn.getAttribute('data-layer');
        this.render();
      });
    });

    const radios = this.mount.querySelectorAll('input[name="modeling"]');
    radios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.modelingService = e.target.value;
        this.render();
      });
    });

    const minusBtn = this.mount.querySelector('#btn-qty-minus');
    const plusBtn = this.mount.querySelector('#btn-qty-plus');
    const qtySlider = this.mount.querySelector('#qty-slider');

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        if (this.state.quantity > 1) {
          this.state.quantity--;
          this.render();
        }
      });
    }
    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        this.state.quantity++;
        this.render();
      });
    }
    if (qtySlider) {
      qtySlider.addEventListener('input', (e) => {
        this.state.quantity = parseInt(e.target.value, 10);
        const qtyNum = this.mount.querySelector('.qty-num');
        if (qtyNum) qtyNum.textContent = this.state.quantity;
        this.render();
      });
    }

    const studentToggle = this.mount.querySelector('#student-toggle');
    if (studentToggle) {
      studentToggle.addEventListener('change', (e) => {
        this.state.isStudent = e.target.checked;
        this.render();
      });
    }

    const rushToggle = this.mount.querySelector('#rush-toggle');
    if (rushToggle) {
      rushToggle.addEventListener('change', (e) => {
        this.state.turnaround = e.target.checked ? 'rush24' : 'standard';
        this.render();
      });
    }

    const delivBtns = this.mount.querySelectorAll('.deliv-card-btn, .deliv-btn');
    delivBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.delivery = btn.getAttribute('data-delivery');
        this.render();
      });
    });

    const wireBtn = this.mount.querySelector('#btn-toggle-wire');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        this.state.wireframe = !this.state.wireframe;
        if (this.studio) this.studio.toggleWireframe(this.state.wireframe);
        wireBtn.classList.toggle('active', this.state.wireframe);
      });
    }

    const camBtn = this.mount.querySelector('#btn-reset-cam');
    if (camBtn) {
      camBtn.addEventListener('click', () => {
        if (this.studio) this.studio.resetCamera();
      });
    }

    const fileInput = this.mount.querySelector('#stl-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && this.studio) {
          this.state.uploadedFileName = file.name;
          this.studio.loadSTLFile(file, () => {
            alert(`✅ "${file.name}" fayli Bambu Lab stoliga muvaffaqiyatli yuklandi!`);
          });
        }
      });
    }

    const slicer = this.mount.querySelector('#slicer-slider');
    const sliceValText = this.mount.querySelector('#slice-val-text');
    if (slicer) {
      slicer.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.slicePercent = val;
        if (sliceValText) sliceValText.textContent = `${val}%`;
        if (this.studio) this.studio.updateSliceClipping(val);
      });
    }

    const submitBtn = this.mount.querySelector('#btn-submit-order-flow');
    const orderModal = this.mount.querySelector('#order-modal');
    const modalClose = this.mount.querySelector('#modal-close');

    if (submitBtn && orderModal) {
      submitBtn.addEventListener('click', () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderIdElem = this.mount.querySelector('#inv-order-num');
        if (orderIdElem) orderIdElem.textContent = `#T3D-UZ-${randomNum}`;
        orderModal.style.display = 'flex';
      });
    }

    if (modalClose && orderModal) {
      modalClose.addEventListener('click', () => {
        orderModal.style.display = 'none';
      });
    }

    const printBtn = this.mount.querySelector('#btn-print-inv');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const copyBtn = this.mount.querySelector('#btn-copy-card');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText('8600490482197750');
        copyBtn.textContent = '✓ Nusxalandi!';
        setTimeout(() => {
          copyBtn.textContent = '📋 Karta Raqamini Nusxalash';
        }, 2000);
      });
    }

    const selectReceiptBtn = this.mount.querySelector('#btn-select-receipt');
    const receiptInput = this.mount.querySelector('#receipt-file-input');
    const receiptPrompt = this.mount.querySelector('#receipt-prompt-area');
    const receiptPreview = this.mount.querySelector('#receipt-preview-area');
    const receiptImg = this.mount.querySelector('#receipt-img-preview');
    const clearReceiptBtn = this.mount.querySelector('#btn-clear-receipt');

    if (selectReceiptBtn && receiptInput) {
      selectReceiptBtn.addEventListener('click', () => receiptInput.click());
    }

    if (receiptInput) {
      receiptInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const maxD = 1000;
            if (w > maxD || h > maxD) {
              if (w > h) {
                h = Math.round((h * maxD) / w);
                w = maxD;
              } else {
                w = Math.round((w * maxD) / h);
                h = maxD;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            this.state.receiptImage = compressed;
            if (receiptImg) receiptImg.src = compressed;
            if (receiptPrompt) receiptPrompt.style.display = 'none';
            if (receiptPreview) receiptPreview.style.display = 'flex';
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (clearReceiptBtn) {
      clearReceiptBtn.addEventListener('click', () => {
        this.state.receiptImage = null;
        if (receiptInput) receiptInput.value = '';
        if (receiptPreview) receiptPreview.style.display = 'none';
        if (receiptPrompt) receiptPrompt.style.display = 'block';
      });
    }

    const checkoutForm = this.mount.querySelector('#checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const custName = this.mount.querySelector('#cust-name').value || 'Mijoz';
        const custPhone = this.mount.querySelector('#cust-phone').value || '+998';
        const pricing = this.calculatePricing();
        const currentType = this.getCurrentOrderType();
        const orderIdVal = this.mount.querySelector('#inv-order-num')?.textContent || '#T3D-UZ-8492';

        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        const orderData = {
          orderId: orderIdVal,
          customerName: custName,
          customerPhone: custPhone,
          customerTelegram: this.mount.querySelector('#cust-tg')?.value || '',
          deliveryAddress: this.mount.querySelector('#cust-addr')?.value || '',
          orderNotes: this.mount.querySelector('#cust-notes')?.value || '',
          orderTypeTitle: currentType.title,
          material: this.getCurrentMaterial().name,
          quantity: this.state.quantity,
          grandTotal: this.formatPrice(pricing.grandTotalUZS),
          turnaround: this.state.turnaround,
          deliveryMethod: this.state.delivery,
          deliveryMethodTitle: this.state.delivery === 'bts' ? '📦 Viloyatlarga BTS Pochta' : (this.state.delivery === 'yandex' ? '🛵 Toshkentda Yandex Dostavka' : '🏬 Ustaxonadan Olib Ketish (Chilonzor)'),
          receiptImage: this.state.receiptImage,
          createdAt: new Date().toISOString()
        };

        // 24/7 Fail-Safe: Buyurtmani barcha xavfsiz kanallar orqali kafolatli yetkazish
        const sendOrderSafely = async () => {
          let backendDelivered = false;
          try {
            const res = await fetch('/api/submit-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });
            if (res.ok) {
              const data = await res.json();
              if (data.ok) backendDelivered = true;
            }
          } catch (apiErr) {
            console.warn('Backend API vaqtincha javob bermadi, zaxira kanalga o‘tilmoqda...');
          }

          // Zaxira: Agar statik GitHub Pages yoki server o'chiq bo'lsa, to'g'ridan-to'g'ri Telegram API orqali yetkazish
          if (!backendDelivered) {
            const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const adminIds = (import.meta.env.VITE_ADMIN_CHAT_IDS || '8929216064').split(',').map(s => s.trim());
            if (botToken) {
              const cleanPhone = (orderData.customerPhone || '').replace(/[^0-9+]/g, '');
              const hasReceipt = Boolean(orderData.receiptImage);
              const tgCaption = `
🚨 <b>YANGI 3D BOSMA BUYURTMASI!</b> ${hasReceipt ? '🧾 (To‘lov cheki biriktirildi)' : ''}

🆔 <b>Buyurtma ID:</b> <code>${orderData.orderId}</code>
👤 <b>Mijoz:</b> ${orderData.customerName}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${orderData.customerPhone}</a>
${orderData.customerTelegram ? `💬 <b>Telegram:</b> ${orderData.customerTelegram}\n` : ''}${orderData.deliveryAddress ? `📍 <b>Manzil:</b> ${orderData.deliveryAddress}\n` : ''}
📦 <b>Buyurtma turi:</b> ${orderData.orderTypeTitle}
🧵 <b>Material:</b> ${orderData.material}
🔢 <b>Soni:</b> ${orderData.quantity} dona
💰 <b>Jami to‘lov:</b> <b>${orderData.grandTotal}</b>
🚚 <b>Yetkazish:</b> ${orderData.deliveryMethodTitle || orderData.deliveryMethod}
⏱️ <b>Tayyorlanish:</b> ${orderData.turnaround === 'rush24' ? '⚡ 24 Soat Ekspress' : 'Standart 48 Soat'}
${orderData.orderNotes ? `\n📝 <b>Izoh:</b> <i>"${orderData.orderNotes}"</i>\n` : ''}
⚡ <i>Holat: 🟡 To‘lov cheki admin tasdig‘i kutilmoqda</i>
              `.trim();

              const tgNick = orderData.customerTelegram ? (orderData.customerTelegram.startsWith('@') ? orderData.customerTelegram : '@' + orderData.customerTelegram) : '';
              const actionKeyboard = {
                inline_keyboard: [
                  [
                    { text: '✅ Qabul qilish (Approve)', callback_data: `approve_${orderData.orderId}` },
                    { text: '❌ Rad etish (Decline)', callback_data: `decline_${orderData.orderId}` }
                  ],
                  [
                    { text: '💬 Mijoz Telegrami', url: tgNick ? `https://t.me/${tgNick.replace('@', '')}` : `https://t.me/+${cleanPhone.replace('+', '')}` }
                  ]
                ]
              };

              for (const adminChatId of adminIds) {
                try {
                  let photoSent = false;
                  if (orderData.receiptImage && orderData.receiptImage.startsWith('data:image')) {
                    try {
                      const parts = orderData.receiptImage.split(';base64,');
                      if (parts.length === 2) {
                        const mime = parts[0].replace('data:', '') || 'image/jpeg';
                        const bstr = atob(parts[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                          u8arr[n] = bstr.charCodeAt(n);
                        }
                        const blob = new Blob([u8arr], { type: mime });
                        const fd = new FormData();
                        fd.append('chat_id', adminChatId);
                        fd.append('photo', blob, 'receipt.jpg');
                        fd.append('caption', tgCaption.slice(0, 1024));
                        fd.append('parse_mode', 'HTML');
                        fd.append('reply_markup', JSON.stringify(actionKeyboard));
                        const resPhoto = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, { method: 'POST', body: fd });
                        const resData = await resPhoto.json();
                        if (resData.ok) photoSent = true;
                      }
                    } catch (pErr) {
                      console.warn('sendPhoto parsing error:', pErr);
                    }
                  }

                  if (!photoSent) {
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: adminChatId,
                        text: tgCaption.slice(0, 4096),
                        parse_mode: 'HTML',
                        reply_markup: actionKeyboard
                      })
                    });
                  }
                } catch (tgSendErr) {
                  console.warn('Direct TG alert error:', tgSendErr);
                }
              }
            }
          }

          // Offline keshda saqlash
          try {
            const cached = JSON.parse(localStorage.getItem('cached_admin_orders') || '[]');
            cached.unshift({ ...orderData, status: 'pending' });
            localStorage.setItem('cached_admin_orders', JSON.stringify(cached.slice(0, 50)));
          } catch (e) {}

          // Telegram WebApp ichida bo'lsa ma'lumot jo'natish
          if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.sendData === 'function') {
            try {
              window.Telegram.WebApp.sendData(JSON.stringify({
                orderId: orderData.orderId,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                grandTotal: orderData.grandTotal
              }));
            } catch (wErr) {}
          }
        };

        sendOrderSafely();

        // Elementlarni olish
        const printableInvoice = this.mount.querySelector('#invoice-printable-area');
        const modalHeader = this.mount.querySelector('.modal-header');
        const verifyingScreen = this.mount.querySelector('#order-verifying-screen');
        const successScreen = this.mount.querySelector('#order-success-screen');
        const declinedScreen = this.mount.querySelector('#order-declined-screen');
        const verifyingOrderNum = this.mount.querySelector('#verifying-order-num');
        const successOrderNum = this.mount.querySelector('#success-order-num');
        const declinedOrderNum = this.mount.querySelector('#declined-order-num');

        // Formani yashirib, DASTLAB "TEKSHIRILMOQDA" ekranini ko'rsatish
        if (checkoutForm) checkoutForm.style.display = 'none';
        if (printableInvoice) printableInvoice.style.display = 'none';
        if (modalHeader) modalHeader.style.display = 'none';

        if (verifyingOrderNum) verifyingOrderNum.textContent = orderIdVal;
        if (verifyingScreen) verifyingScreen.style.display = 'block';

        // 1. Tasdiqlanganda chaqiriladigan funksiya
        const activateApproved = () => {
          if (verifyingScreen) verifyingScreen.style.display = 'none';
          if (declinedScreen) declinedScreen.style.display = 'none';
          if (successOrderNum) successOrderNum.textContent = orderIdVal;
          if (successScreen) successScreen.style.display = 'block';

          // Telegram bot linkiga aniq buyurtma raqamini biriktirish
          const orderDigits = orderIdVal.replace(/\D/g, '');
          const gotoBotBtn = this.mount.querySelector('#btn-goto-bot');
          if (gotoBotBtn) {
            gotoBotBtn.href = `https://t.me/Any3dCubic_bot?start=${orderDigits || 'live'}`;
          }
          const tipDigits = this.mount.querySelector('#tip-order-digits');
          if (tipDigits) {
            tipDigits.textContent = orderDigits || '5452';
          }

          confetti({
            particleCount: 140,
            spread: 75,
            origin: { y: 0.6 }
          });

          const gotoTrackerBtn = this.mount.querySelector('#btn-goto-tracker');
          if (gotoTrackerBtn) {
            gotoTrackerBtn.onclick = () => {
              if (orderModal) orderModal.style.display = 'none';
              if (this.onOrderSubmitted) {
                this.onOrderSubmitted(orderData);
              }
            };
          }
        };

        // 2. Rad etilganda (Fake chek) chaqiriladigan funksiya
        const activateDeclined = () => {
          if (verifyingScreen) verifyingScreen.style.display = 'none';
          if (successScreen) successScreen.style.display = 'none';
          if (declinedOrderNum) declinedOrderNum.textContent = orderIdVal;
          if (declinedScreen) declinedScreen.style.display = 'block';

          const reuploadBtn = this.mount.querySelector('#btn-reupload-receipt');
          if (reuploadBtn) {
            reuploadBtn.onclick = () => {
              if (declinedScreen) declinedScreen.style.display = 'none';
              if (checkoutForm) checkoutForm.style.display = 'block';
              if (printableInvoice) printableInvoice.style.display = 'block';
              if (modalHeader) modalHeader.style.display = 'flex';

              // Chek yuklash maydonini tozalash
              this.state.receiptImage = null;
              if (receiptInput) receiptInput.value = '';
              if (receiptPreview) receiptPreview.style.display = 'none';
              if (receiptPrompt) receiptPrompt.style.display = 'block';
              receiptPrompt?.scrollIntoView({ behavior: 'smooth' });
            };
          }
        };

        // Haqiqiy Telegram Bot orqali admin (@any3DCubicc) tasdiqlashini kutuvchi avtomatik tekshiruv (Polling)
        let checkCount = 0;
        const statusChecker = setInterval(async () => {
          checkCount++;
          if (checkCount > 180) { // 6 daqiqadan so'ng to'xtatish
            clearInterval(statusChecker);
            return;
          }
          try {
            const res = await fetch(`/api/order-status?id=${encodeURIComponent(orderIdVal)}`);
            const data = await res.json();
            if (data.ok && data.status) {
              if (data.status === 'approved') {
                clearInterval(statusChecker);
                activateApproved();
              } else if (data.status === 'declined') {
                clearInterval(statusChecker);
                activateDeclined();
              }
            }
          } catch (e) {
            // Static hosting or offline
          }
        }, 2000);
      });
    }

    const directTgBtn = this.mount.querySelector('#btn-direct-telegram');
    if (directTgBtn) {
      directTgBtn.addEventListener('click', () => {
        const pricing = this.calculatePricing();
        const currentType = this.getCurrentOrderType();
        const text = encodeURIComponent(
          `Assalomu alaykum! 3D bosmaga buyurtma bermoqchiman:\n\n` +
          `• Buyurtma Turi: ${currentType.title}\n` +
          `• Material: ${this.getCurrentMaterial().name}\n` +
          `• Soni: ${this.state.quantity} dona\n` +
          `• Zichlik: ${this.state.infill}% | Qatlam: ${this.state.layerHeight}mm\n` +
          `• Taxminiy Summa: ${this.formatPrice(pricing.grandTotalUZS)}\n\n` +
          `Chilonzor ustaxonangizda qachon tayyor bo‘ladi?`
        );
        window.open(`https://t.me/Any3dCubic_bot?start=order_${Date.now()}`, '_blank');
      });
    }
  }
}
