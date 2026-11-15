# Toshkent 3D Ustaxonasi (Any3D Cubic) — 24/7 Bot & Buyurtma Portali 🚀

Ushbu tizim Toshkent shahridagi 3D bosma ustaxonasi uchun maxsus ishlab chiqilgan bo‘lib, Telegram bot (`@Any3dCubic_bot`), Web Mini App, Admin CRM va 24/7 o‘chib qolmaydigan uzluksiz infratuzilmani o‘z ichiga oladi.

---

## 🌟 Tizim Imkoniyatlari

1. **24/7 Uzluksiz Ishlash (Never-Down Architecture):**
   - **Render.com / Koyeb / Railway / Vercel** orqali bepul 24/7 bulutli server.
   - **O‘z-o‘zini uyg‘otish (Self-Ping Keep-Alive):** Har 8 daqiqada `/health` manziliga avtomatik so‘rov yuborib, serverni uyquga ketishdan asraydi.
   - **GitHub Actions Uptime Cron:** Har 15 daqiqada bot holatini tekshiruvchi fon tekshiruvi.
   - **Zaxira (Fail-Safe Direct Relay):** Agar server o‘chiq bo‘lsa ham, veb-sayt buyurtmalarni to‘g‘ridan-to‘g‘ri Telegram Bot API orqali adminlarga yetkazadi. Buyurtma va cheklar hech qachon yo‘qolmaydi!

2. **🤖 Telegram Bot (@Any3dCubic_bot):**
   - 4K Ultra HD brend logotipi.
   - Yangi buyurtma tushganda chek rasmi, mijoz raqami va narxlar bilan birga darhol xabar yuborish.
   - **Inline Tugmalar:** `✅ Qabul qilish (Approve)` va `❌ Rad etish (Fake)`.
   - **Mijoz Bilan Jonli Chat Bildirishnomalari:** Mijoz saytdan xabar yozganda adminlarga Telegramdan ogohlantirish keladi.
   - **Bot Buyruqlari:**
     - `/start` — Botni qayta ishga tushirish va menyu.
     - `/status` yoki `/stats` — Server uptime, RAM sarfi, jami buyurtmalar telemetriyasi.
     - `/orders` — Oxirgi tushgan 5 ta buyurtma ro‘yxati.
     - `/live` — Anycubic dastgohi real vaqt telemetriyasi (ekstruder 215°C, stol 60°C).
     - `/help` — Yordam va ma'lumotlar.

3. **📍 Jonli Lokatsiya & Xaritalar:**
   - Saytda Chilonzor ustaxonamiz lokatsiyasi Google Maps, Yandex Maps / Yandex Go va Apple Maps bilan to‘liq integratsiya qilingan.

4. **🚚 Shaffof Yetkazib Berish (0 so‘m):**
   - Sayt chekiga yetkazish puli qo‘shilmaydi. Toshkent bo‘yicha Yandex Dostavka (kuryerga to‘lanadi), viloyatlarga BTS Pochta orqali posilkani olishda to‘lanadi.

5. **🛡️ Veb Admin CRM & Mijozlar Portali:**
   - Barcha mijozlar profillari, telefonlari, to‘lov cheklarini tekshirish va veb orqali jonli yozishish imkoni.

---

## 🚀 24/7 Bepul Serverga Joylash (1-Click Deployment)

### Variant 1: Render.com (Eng oson va 100% bepul)
1. [Render.com](https://render.com) ga kiring va GitHub akkauntingiz orqali ulaning.
2. **New +** -> **Web Service** ni tanlang.
3. Ushbu `any3dcubic-bot` repositorysini tanlang.
4. Render sozlamalari (`render.yaml` orqali avtomatik aniqlanadi):
   - **Build Command:** `npm install`
   - **Start Command:** `node server/standalone.js`
   - **Environment Variables:**
     - `TELEGRAM_BOT_TOKEN`: `sizning_bot_tokeningiz`
     - `WEB_APP_URL`: `https://muhammadrizoxayrullayev-commits.github.io/t3d/`
     - `PUBLIC_URL`: `https://sizning-loyiha.onrender.com`
5. **Deploy Web Service** tugmasini bosing. Bo‘ldi! Server 24/7 o‘chmasdan ishlaydi!

---

### Variant 2: Mac Kompyuterda 24/7 Fon Xizmati (launchd daemon)
Kompyuteringiz yoniq turganda bot terminal ochilmasa ham o‘z-o‘zidan fonda ishlab turishi uchun:

```bash
# Xizmatni o'rnatish va fon rejimida yoqish:
./scripts/install-service-mac.sh

# Holatini tekshirish:
./scripts/status.sh

# To'xtatish kerak bo'lsa:
./scripts/stop-service-mac.sh
```

---

## 💻 Mahalliy Ishga Tushirish (Development)

```bash
# Bog'liqliklarni o'rnatish
npm install

# Veb-ilova va botni birgalikda ishga tushirish
npm run dev

# Faqat 24/7 server va botni ishga tushirish
npm start
```

---

## 🌐 Jonli Havolalar
- **Veb Mini App:** [https://muhammadrizoxayrullayev-commits.github.io/t3d/](https://muhammadrizoxayrullayev-commits.github.io/t3d/)
- **Telegram Bot:** [@Any3dCubic_bot](https://t.me/Any3dCubic_bot)
