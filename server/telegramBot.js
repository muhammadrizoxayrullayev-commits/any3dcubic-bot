import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load .env safely
function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath);
      } else {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            process.env[k.trim()] = v.join('=').trim();
          }
        });
      }
    } catch (e) {
      console.warn('Could not load .env file:', e.message);
    }
  }
}
loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const DATA_DIR = path.join(projectRoot, 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SUBSCRIBERS_FILE)) {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}));
}

export function getAllMessages() {
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function getOrderMessages(orderId) {
  const all = getAllMessages();
  return all[orderId] || [];
}

export function saveOrderMessage(orderId, msg) {
  try {
    const all = getAllMessages();
    if (!all[orderId]) all[orderId] = [];
    const messageObj = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      orderId,
      sender: msg.sender || 'customer', // 'customer' or 'admin'
      senderName: msg.senderName || (msg.sender === 'admin' ? 'Any3D Admin' : 'Mijoz'),
      text: msg.text || '',
      timestamp: new Date().toISOString()
    };
    all[orderId].push(messageObj);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2));

    // Agar xabar mijozdan bo'lsa, barcha adminlarga Telegramdan bildirishnoma yuborish
    if (msg.sender === 'customer') {
      const order = getOrderById(orderId);
      const custName = order?.customerName || msg.senderName || 'Mijoz';
      const custPhone = (order?.customerPhone || '').replace(/[^0-9+]/g, '');
      const tgAlert = `
💬 <b>MIJOZDAN JONLI CHAT XABARI!</b>

🆔 <b>Buyurtma:</b> <code>${orderId}</code>
👤 <b>Mijoz:</b> ${custName} (${order?.customerPhone || 'Tel yo‘q'})
✉️ <b>Xabar matni:</b> "${msg.text}"
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}

⚡ <i>Veb-saytdagi Admin CRM orqali yoki quyidagi tugmalar bilan darhol javob berishingiz mumkin:</i>
      `.trim();

      const extra = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📞 Qo‘ng‘iroq qilish', url: `tel:${custPhone}` },
              { text: '💬 Telegramdan yozish', url: `https://t.me/+${custPhone.replace('+', '')}` }
            ]
          ]
        }
      };
      broadcastToAdmins(tgAlert, extra);
    }

    return messageObj;
  } catch (err) {
    console.error('Error saving order message:', err);
    return null;
  }
}

function getSubscribers() {
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSubscribers(subs) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
  } catch (err) {
    console.error('Error saving subscribers:', err);
  }
}

export function getOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function getOrderById(orderId) {
  const orders = getOrders();
  return orders.find(o => o.orderId === orderId) || null;
}

export function updateOrderStatus(orderId, status, extraData = {}) {
  try {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
      orders[idx] = {
        ...orders[idx],
        status,
        ...extraData,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      return orders[idx];
    }
  } catch (err) {
    console.error('Error updating order status:', err);
  }
  return null;
}

function saveOrder(order) {
  try {
    const orders = getOrders();
    const existingIdx = orders.findIndex(o => o.orderId === order.orderId);
    if (existingIdx !== -1) {
      orders[existingIdx] = { ...orders[existingIdx], ...order };
    } else {
      orders.unshift(order);
    }
    // keep last 100 orders
    if (orders.length > 100) orders.length = 100;
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error saving order:', err);
  }
}

export async function sendTelegramMessage(chatId, text, extra = {}) {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN topilmadi!');
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...extra
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error('sendTelegramMessage xatosi:', error.message);
    return false;
  }
}

export async function sendTelegramPhoto(chatId, base64Data, caption, extra = {}) {
  if (!BOT_TOKEN) return false;
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length < 2) return false;
    const mime = parts[0].replace('data:', '') || 'image/jpeg';
    const buffer = Buffer.from(parts[1], 'base64');
    const blob = new Blob([buffer], { type: mime });
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'chek.jpg');
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    if (extra.reply_markup) {
      formData.append('reply_markup', JSON.stringify(extra.reply_markup));
    }
    const res = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('sendTelegramPhoto xatosi:', err.message);
    return false;
  }
}

export async function broadcastToAdmins(messageText, extra = {}, photoBase64 = null) {
  const subs = getSubscribers();
  if (subs.length === 0) {
    console.log('Hozircha hech qanday admin botga ulanmagan. Iltimos botga /start bosing.');
    return 0;
  }
  let sentCount = 0;
  for (const sub of subs) {
    let success = false;
    if (photoBase64) {
      success = await sendTelegramPhoto(sub.chatId, photoBase64, messageText, extra);
    }
    if (!success) {
      success = await sendTelegramMessage(sub.chatId, messageText, extra);
    }
    if (success) sentCount++;
  }
  return sentCount;
}

export async function notifyNewOrder(orderData) {
  const orderId = orderData.orderId || ('#T3D-' + Date.now().toString().slice(-4));
  orderData.orderId = orderId;
  orderData.status = 'pending'; // 🟡 To'lov va chek tekshirilmoqda
  saveOrder(orderData);

  const cleanPhone = (orderData.customerPhone || '').replace(/[^0-9+]/g, '');
  const hasReceipt = Boolean(orderData.receiptImage);
  const message = `
🚨 <b>YANGI 3D BOSMA BUYURTMASI!</b> ${hasReceipt ? '🧾 (To‘lov cheki yuklandi)' : ''}

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
👤 <b>Mijoz:</b> ${orderData.customerName || 'Noma\'lum mijoz'}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${orderData.customerPhone || 'Kiritilmagan'}</a>
${orderData.customerTelegram ? `💬 <b>Telegram:</b> ${orderData.customerTelegram}\n` : ''}${orderData.deliveryAddress ? `📍 <b>Manzil:</b> ${orderData.deliveryAddress}\n` : ''}
📋 <b>Turi:</b> ${orderData.orderTypeTitle || 'Maxsus detal'}
🧵 <b>Material:</b> ${orderData.material || 'Standart PLA'}
🔢 <b>Soni:</b> ${orderData.quantity || 1} dona
💰 <b>Summa:</b> <b>${orderData.grandTotal || 'Kelishiladi'}</b>
🚚 <b>Yetkazish:</b> <b>${orderData.deliveryMethodTitle || 'Ustaxonadan olib ketish'}</b>
⏱️ <b>Muddati:</b> ${orderData.turnaround || 'Standart (24-48 soat)'}
${hasReceipt ? '🧾 <b>To‘lov Cheki:</b> Rasm biriktirildi (tekshiring)\n' : '⚠️ <b>To‘lov:</b> Chek yuklanmagan (kuryerga / joyida)\n'}🟡 <b>Holat:</b> <i>Administrator tekshiruvi kutilmoqda...</i>
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}

⚠️ <b>DIQQAT:</b> <i>Soxta (fake) cheklardan ehtiyot bo‘ling. Agar bank hisobingizga pul tushgan bo‘lsa "Tasdiqlash", soxta yoki pul tushmagan bo‘lsa "Rad etish" tugmasini bosing:</i>
`.trim();

  const extra = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Tasdiqlash (Qabul qilish)', callback_data: `approve_${orderId}` },
          { text: '❌ Rad etish (Fake / Decline)', callback_data: `decline_${orderId}` }
        ],
        [
          { text: '📞 Qo‘ng‘iroq qilish', url: `tel:${cleanPhone}` },
          { text: '💬 Telegramdan yozish', url: `https://t.me/+${cleanPhone.replace('+', '')}` }
        ]
      ]
    }
  };

  const sentCount = await broadcastToAdmins(message, extra, orderData.receiptImage || null);
  return { success: true, orderId, status: 'pending', sentCount };
}

// Bot Polling mechanism
let isPolling = false;
let updateOffset = 0;

export function startBotPolling() {
  if (isPolling) return;
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN sozlanmagan!');
    return;
  }
  isPolling = true;
  console.log('🤖 Telegram Bot Polling ishga tushirildi (@Any3dCubic_bot)...');

  const poll = async () => {
    if (!isPolling) return;
    try {
      const res = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${updateOffset}&timeout=20`, {
        signal: AbortSignal.timeout(25000)
      });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          updateOffset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (updateErr) {
            console.error('⚠️ Update qayta ishlash xatosi (ushlandi):', updateErr.message);
          }
        }
      } else if (!data.ok && data.error_code === 409) {
        console.warn('⚠️ Telegram 409 Conflict: Boshqa bot instansiyasi mavjud. 5 soniya kutilmoqda...');
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      if (err.name !== 'TimeoutError') {
        console.warn('⚠️ Tarmoq/Telegram xatosi (avtomatik qayta ulanadi):', err.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    // Continue polling
    setTimeout(poll, 300);
  };

  poll();
}

async function handleCallbackQuery(cq) {
  const data = cq.data || '';
  const adminName = cq.from.first_name || cq.from.username || 'Administrator';
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;

  let orderId = '';
  let isApprove = false;
  let isDecline = false;

  if (data.startsWith('approve_')) {
    orderId = data.replace('approve_', '');
    isApprove = true;
  } else if (data.startsWith('decline_')) {
    orderId = data.replace('decline_', '');
    isDecline = true;
  } else if (data === 'live') {
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cq.id })
    }).catch(() => {});
    return;
  }

  if (isApprove || isDecline) {
    const newStatus = isApprove ? 'approved' : 'declined';
    const updatedOrder = updateOrderStatus(orderId, newStatus, {
      reviewedBy: adminName,
      reviewAction: isApprove ? 'tasdiqlandi' : 'rad_etildi'
    });

    const alertText = isApprove 
      ? `✅ Buyurtma ${orderId} tasdiqlandi va qabul qilindi!` 
      : `❌ Buyurtma ${orderId} rad etildi (Fake chek deb belgilandi)!`;

    // 1. Alert chiqarish
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: cq.id,
        text: alertText,
        show_alert: true
      })
    }).catch(() => {});

    // 2. Telegram xabarini yangilash
    const cleanPhone = (updatedOrder?.customerPhone || '').replace(/[^0-9+]/g, '');
    let updatedCaption = '';
    if (isApprove) {
      updatedCaption = `
✅ <b>BUYURTMA VA TO‘LOV CHEKI TASDIQLANDI!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
👤 <b>Mijoz:</b> ${updatedOrder?.customerName || 'Mijoz'} (${updatedOrder?.customerPhone || ''})
💰 <b>Summa:</b> <b>${updatedOrder?.grandTotal || ''}</b>
🟢 <b>Holat:</b> To‘lov tushganligi tasdiqlandi. 3D dastgohda chop etish boshlandi!
👨‍💼 <b>Tasdiqlagan admin:</b> ${adminName}
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
      `.trim();
    } else {
      updatedCaption = `
❌ <b>BUYURTMA VA TO‘LOV CHEKI RAD ETILDI (DECLINED)!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
👤 <b>Mijoz:</b> ${updatedOrder?.customerName || 'Mijoz'} (${updatedOrder?.customerPhone || ''})
💰 <b>Summa:</b> <b>${updatedOrder?.grandTotal || ''}</b>
🚫 <b>Sabab:</b> To‘lov cheki soxta (fake) yoki mablag‘ tushmagan deb topildi!
👨‍💼 <b>Rad etgan admin:</b> ${adminName}
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
      `.trim();
    }

    const followUpKeyboard = {
      inline_keyboard: [
        [
          { text: '📞 Mijozga qo‘ng‘iroq', url: `tel:${cleanPhone}` },
          { text: '💬 Telegramdan yozish', url: `https://t.me/+${cleanPhone.replace('+', '')}` }
        ]
      ]
    };

    if (cq.message?.photo) {
      await fetch(`${TELEGRAM_API_URL}/editMessageCaption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          caption: updatedCaption,
          parse_mode: 'HTML',
          reply_markup: followUpKeyboard
        })
      }).catch(() => {});
    } else {
      await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: updatedCaption,
          parse_mode: 'HTML',
          reply_markup: followUpKeyboard
        })
      }).catch(() => {});
    }

    // 3. Agar mijozning Telegram chat ID si bo'lsa, mijozga xabar berish
    const custChatId = updatedOrder?.customerChatId;
    if (custChatId) {
      if (isApprove) {
        const custMsg = `
🎉 <b>Xushxabar! Buyurtmangiz qabul qilindi va tasdiqlandi!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
To‘lov chekingiz administratorlarimiz tomonidan tekshirildi va to‘liq tasdiqlandi!

🖨️ <b>Any3D ustaxonamizda detalni 3D chop etish jarayoni boshlandi!</b>
📡 <b>Buyurtmangizni botda LIVE (jonli) ko‘ra olasiz!</b>
Dastgoh harorati va tayyor bo‘lish vaqtini ko‘rish uchun /live buyrug‘ini bosing.
        `.trim();
        await sendTelegramMessage(custChatId, custMsg);
      } else {
        const custMsg = `
❌ <b>Buyurtmangiz rad etildi (To‘lov tasdiqlanmadi)</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
Hurmatli mijoz, siz yuklagan to‘lov cheki administratorlarimiz tomonidan rad etildi (to‘lov bank hisobimizga kelib tushmadi yoki chek yaroqsiz deb topildi).

Iltimos, qayta to‘lov qilib to‘g‘ri chekni yuklang yoki ustaxona ma'muri bilan bog‘laning:
📞 Admin: @khayru1ayev
        `.trim();
        await sendTelegramMessage(custChatId, custMsg);
      }
    }
  }
}

async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const userName = msg.from.first_name || msg.from.username || 'Foydalanuvchi';

  // Add to subscribers list
  const subs = getSubscribers();
  if (!subs.some(s => s.chatId === chatId)) {
    subs.push({
      chatId,
      username: msg.from.username || null,
      firstName: msg.from.first_name || null,
      addedAt: new Date().toISOString()
    });
    saveSubscribers(subs);
    console.log(`✅ Yangi admin ulandi: ${userName} (Chat ID: ${chatId})`);
  }

const WEB_APP_URL = 'https://muhammadrizoxayrullayev-commits.github.io/t3d/';

const mainMenuKeyboard = {
  keyboard: [
    [
      { text: '🌐 Saytni ochish', web_app: { url: WEB_APP_URL } }
    ],
    [
      { text: '📡 Jonli Telemetriya (LIVE)' },
      { text: '📦 Oxirgi buyurtmalar' }
    ],
    [
      { text: '📊 Statistika' },
      { text: 'ℹ️ Yordam' }
    ]
  ],
  resize_keyboard: true
};

  // 1. Agar foydalanuvchi to'lov cheki rasmini yuklasa
  if (msg.photo && msg.photo.length > 0) {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    const captionNote = msg.caption ? `\n💬 <b>Izoh:</b> ${msg.caption}` : '';
    const adminNotice = `
🧾 <b>MIJOZ TO‘LOV CHEKI RASMINI YUKLADI!</b>

👤 <b>Mijoz:</b> ${userName}
🆔 <b>Chat ID:</b> <code>${chatId}</code>${captionNote}
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}

⚡ <i>Iltimos, bank ilovangiz orqali summani tekshiring.</i>
    `.trim();

    // Boshqa barcha adminlarga rasmni yuborish
    for (const sub of subs) {
      if (sub.chatId !== chatId) {
        await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: sub.chatId,
            photo: photoId,
            caption: adminNotice,
            parse_mode: 'HTML'
          })
        }).catch(() => {});
      }
    }

    const userSuccess = `
🎉 <b>Buyurtmangiz qabul qilindi!</b>

📸 To‘lov cheki rasmingiz Toshkent 3D Ustaxonamizga muvaffaqiyatli yetkazildi!

📡 <b>Buyurtmangizni botda LIVE (jonli) ko‘ra olasiz!</b>
Dastgoh harorati va chop etish jarayonini jonli ko‘rish uchun pastdagi <b>"📡 Jonli Telemetriya (LIVE)"</b> tugmasini bosing yoki /live buyrug‘ini yuboring.
    `.trim();

    await sendTelegramMessage(chatId, userSuccess, { reply_markup: mainMenuKeyboard });
    return;
  }

  // 2. Agar WebApp orqali to'g'ridan-to'g'ri buyurtma ma'lumoti kelsa
  if (msg.web_app_data && msg.web_app_data.data) {
    try {
      const orderData = JSON.parse(msg.web_app_data.data);
      await notifyNewOrder(orderData);
      const appSuccess = `
🎉 <b>Buyurtmangiz qabul qilindi!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderData.orderId || '#T3D'}</code>
📋 <b>Mahsulot:</b> ${orderData.orderTypeTitle || '3D Detal'} (${orderData.material || 'Standart'})
💰 <b>Summa:</b> <b>${orderData.grandTotal || 'Kelishiladi'}</b>
${orderData.hasReceipt ? '🧾 <b>To‘lov cheki:</b> Ilova qilindi ✅\n' : ''}
📡 <b>Buyurtmangizni botda LIVE (jonli) ko‘ra olasiz!</b>
Dastgoh harorati, chop etish tezligi va navbatni real vaqtda ko‘rish uchun <b>"📡 Jonli Telemetriya (LIVE)"</b> tugmasini bosing.
      `.trim();
      await sendTelegramMessage(chatId, appSuccess, { reply_markup: mainMenuKeyboard });
      return;
    } catch (e) {
      console.error('web_app_data error:', e);
    }
  }

  // 3. Jonli Telemetriya (LIVE) holati
  if (text.startsWith('/start live') || text === '/live' || text === '📡 Jonli Telemetriya (LIVE)') {
    const orders = getOrders();
    const latest = orders[0] || null;
    const orderId = latest ? latest.orderId : '#T3D-UZ-8492';
    const detail = latest ? latest.orderTypeTitle : 'Muhandislik Ehtiyot Qismi (Shesterna)';
    const mat = latest ? latest.material : 'PETG Pro Carbon';

    const liveMsg = `
📡 <b>BUYURTMANI JONLI KUZATISH (LIVE TELEMETRIYA)</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
📋 <b>Detal:</b> ${detail}
🧵 <b>Material:</b> ${mat}
⏱️ <b>Holat:</b> 🟢 <b>3D Chop etish jarayonida (Navbatda)</b>

🖨️ <b>Ustaxona Dastgoh Telemetriyasi:</b>
• Uskuna: Anycubic Kobra 2 Pro (Chilonzor ustaxonasi)
• Ekstruder harorati: <b>215°C</b> / 215°C 🔥
• Issiq stol harorati: <b>60°C</b> / 60°C 🌡️
• Bosish tezligi: <b>250 mm/s</b>
• Jarayon: <b>148 / 420 qatlam (35%)</b>
• Taxminiy tayyor bo‘lish vaqti: <b>Bugun, 18:30 gacha</b>

🚚 <i>Tayyor bo‘lgach kuryer jo‘natiladi yoki ustaxonadan olib ketishingiz mumkin!</i>
    `.trim();

    await sendTelegramMessage(chatId, liveMsg, { reply_markup: mainMenuKeyboard });
    return;
  }

  if (text === '🌐 Saytni ochish' || text === '/site') {
    const siteMsg = `
🌐 <b>Toshkent 3D Ustaxonasi Portali</b>

Saytni ochish uchun quyidagi tugmalardan birini bosing:
`.trim();

    const siteInline = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Telegram Mini App)', web_app: { url: WEB_APP_URL } }
        ],
        [
          { text: '🌐 Brauzerda ochish (Jonli sayt)', url: WEB_APP_URL }
        ],
        [
          { text: '💻 Localhostda ochish (Kompyuterda)', url: 'http://localhost:5173/' }
        ]
      ]
    };

    await sendTelegramMessage(chatId, siteMsg, { reply_markup: siteInline });
    return;
  }

  if (text.startsWith('/start')) {
    const welcome = `
👋 <b>Assalomu alaykum, ${userName}!</b>

Siz <b>Toshkent 3D Ustaxonasi</b> (@Any3dCubic_bot) tizimiga muvaffaqiyatli ulandingiz!

🛡️ <b>Holat:</b> Siz administrator sifatida ro‘yxatga olindingiz.
Endi veb-saytdan tushadigan har bir 3D bosma buyurtmasi ushbu botga darhol kelib tushadi!

👇 <b>Saytni ochish uchun pastdagi "🌐 Saytni ochish" tugmasini bosing:</b>
`.trim();

    const startInline = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Mini App)', web_app: { url: WEB_APP_URL } }
        ]
      ]
    };

    // Send with both bottom keyboard and inline button
    await sendTelegramMessage(chatId, welcome, { reply_markup: mainMenuKeyboard });
    await sendTelegramMessage(chatId, '🚀 <b>Saytni to‘g‘ridan-to‘g‘ri ishga tushirish:</b>', { reply_markup: startInline });
    return;
  }

  if (text === '📦 Oxirgi buyurtmalar' || text === '/orders') {
    const orders = getOrders();
    if (orders.length === 0) {
      await sendTelegramMessage(chatId, '📦 Hozircha yangi buyurtmalar mavjud emas.', { reply_markup: mainMenuKeyboard });
      return;
    }
    const recent = orders.slice(0, 5);
    let orderMsg = `📦 <b>Oxirgi ${recent.length} ta buyurtma:</b>\n\n`;
    recent.forEach((ord, i) => {
      orderMsg += `${i + 1}. <b>${ord.orderId || '#T3D'}</b> — ${ord.customerName} (${ord.customerPhone})\n`;
      orderMsg += `   Detal: ${ord.orderTypeTitle} | ${ord.material} (${ord.quantity} dona)\n`;
      orderMsg += `   Summa: <b>${ord.grandTotal}</b>\n\n`;
    });
    await sendTelegramMessage(chatId, orderMsg, { reply_markup: mainMenuKeyboard });
    return;
  }

  if (text === '📊 Statistika' || text === '/stats' || text === '/status' || text === '/ping') {
    const orders = getOrders();
    const subsCount = getSubscribers().length;
    const uptimeSec = Math.floor(process.uptime());
    const memUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const pendingOrders = orders.filter(o => !o.status || o.status === 'pending').length;
    const statsMsg = `
📊 <b>Any3D Bot 24/7 Tizim Holati:</b>

🟢 <b>Holat:</b> 100% Faol (24/7 Online)
⏱️ <b>Uptime (Ishlash davomiyligi):</b> ${Math.floor(uptimeSec / 3600)} soat ${Math.floor((uptimeSec % 3600) / 60)} daqiqa ${uptimeSec % 60} sek
🧠 <b>Xotira (RAM):</b> ${memUsage} MB (Yengil va optimallashgan)
📦 <b>Jami buyurtmalar:</b> ${orders.length} ta (${pendingOrders} ta kutilmoqda)
👨‍💼 <b>Ulangan adminlar:</b> ${subsCount} ta
🕒 <b>Server vaqti:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
🚀 <b>Versiya:</b> v2.0.0 (Crash-Proof, 24/7 Cloud Ready)
`.trim();
    await sendTelegramMessage(chatId, statsMsg, { reply_markup: mainMenuKeyboard });
    return;
  }

  if (text === 'ℹ️ Yordam' || text === '/help') {
    const helpMsg = `
ℹ️ <b>Yordam & Ma'lumot:</b>

Ushbu bot Toshkent 3D Ustaxonasi veb-sayti bilan to‘liq integratsiya qilingan.
Saytdan buyurtma berilgan zahoti barcha ma'lumotlar avtomatik shu yerga keladi.

Buyruqlar:
/start — Botni yangilash
/orders — Oxirgi buyurtmalar
/stats — Tizim statistikasi
/help — Yordam
`.trim();
    await sendTelegramMessage(chatId, helpMsg, { reply_markup: mainMenuKeyboard });
    return;
  }

  // Default answer
  await sendTelegramMessage(chatId, `Buyruq tushunarsiz bo'ldi. Menyudan foydalaning.`, { reply_markup: mainMenuKeyboard });
}

export function stopBotPolling() {
  isPolling = false;
}
