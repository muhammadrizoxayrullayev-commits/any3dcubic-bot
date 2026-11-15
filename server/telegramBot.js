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
export const EXCLUSIVE_ADMIN_CHAT_ID = Number(process.env.EXCLUSIVE_ADMIN_CHAT_ID) || 8929216064;
export const EXCLUSIVE_ADMIN_USERNAME = (process.env.EXCLUSIVE_ADMIN_USERNAME || 'any3DCubicc').replace('@', '');
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

const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export function getOrderById(orderId) {
  if (!orderId) return null;
  const orders = getOrders();
  const rawQuery = String(orderId).trim();
  const cleanQuery = rawQuery.toLowerCase();
  const queryDigits = cleanQuery.replace(/\D/g, ''); // masalan "5452"

  // 1. Aniq orderId bo'yicha moslik
  let found = orders.find(o => o.orderId && o.orderId.toLowerCase() === cleanQuery);
  if (found) return found;

  // 2. Raqamlar bo'yicha moslik (masalan "5452" kelsa "#T3D-UZ-5452" yoki "pm5452" ni topadi)
  if (queryDigits.length >= 3) {
    found = orders.find(o => {
      if (!o.orderId) return false;
      const idDigits = String(o.orderId).replace(/\D/g, '');
      return idDigits === queryDigits || idDigits.endsWith(queryDigits) || idDigits.includes(queryDigits);
    });
    if (found) return found;
  }

  // 3. Qisman matn mosligi
  found = orders.find(o => o.orderId && o.orderId.toLowerCase().includes(cleanQuery));
  if (found) return found;

  // 4. Mijoz telefon raqami orqali qidirish
  if (queryDigits.length >= 7) {
    found = orders.find(o => {
      if (!o.customerPhone) return false;
      const phoneDigits = String(o.customerPhone).replace(/\D/g, '');
      return phoneDigits.includes(queryDigits);
    });
    if (found) return found;
  }

  return null;
}

export function updateOrderStatus(orderId, status, extraData = {}) {
  try {
    const orders = getOrders();
    // Mos buyurtmani qidirish
    const targetOrder = getOrderById(orderId);
    if (!targetOrder) return null;

    const idx = orders.findIndex(o => o.orderId === targetOrder.orderId);
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

    // Agar chek base64 bo'lsa, uni alohida rasm fayliga ham saqlash
    if (order.receiptImage && order.receiptImage.startsWith('data:image')) {
      try {
        const safeName = String(order.orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = path.join(RECEIPTS_DIR, `${safeName}.jpg`);
        const parts = order.receiptImage.split(';base64,');
        if (parts.length >= 2) {
          fs.writeFileSync(filePath, Buffer.from(parts[1], 'base64'));
          order.receiptPath = filePath;
        }
      } catch (imgErr) {
        console.warn('Chek rasmini saqlashda ogohlantirish:', imgErr.message);
      }
    }

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

export async function sendTelegramPhoto(chatId, photoSource, caption, extra = {}) {
  if (!BOT_TOKEN || !photoSource) return false;
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption || '');
    formData.append('parse_mode', 'HTML');
    if (extra.reply_markup) {
      formData.append('reply_markup', JSON.stringify(extra.reply_markup));
    }

    if (typeof photoSource === 'string') {
      // 1. Agar Base64 formatida bo'lsa
      if (photoSource.startsWith('data:image')) {
        const parts = photoSource.split(';base64,');
        if (parts.length >= 2) {
          const mime = parts[0].replace('data:', '') || 'image/jpeg';
          const buffer = Buffer.from(parts[1], 'base64');
          const blob = new Blob([buffer], { type: mime });
          formData.append('photo', blob, 'chek.jpg');
        } else {
          return false;
        }
      }
      // 2. Agar diskdagi lokal rasm fayli bo'lsa
      else if (fs.existsSync(photoSource)) {
        const fileBuffer = fs.readFileSync(photoSource);
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append('photo', blob, path.basename(photoSource));
      }
      // 3. Agar Telegram file_id bo'lsa
      else if (!photoSource.includes('/') && photoSource.length > 20) {
        formData.append('photo', photoSource);
      }
      // 4. URL bo'lsa
      else if (photoSource.startsWith('http')) {
        formData.append('photo', photoSource);
      } else {
        return false;
      }
    } else {
      return false;
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

export async function sendOrderDetailsToUser(chatId, order, isExclusiveAdmin, keyboard = {}) {
  const cleanPhone = (order.customerPhone || '').replace(/[^0-9+]/g, '');
  const tgNick = order.customerTelegram 
    ? (order.customerTelegram.startsWith('@') ? order.customerTelegram : '@' + order.customerTelegram) 
    : 'Kiritilmagan';

  let statusBadge = '🟡 <b>ADMIN TASDIG‘I KUTILMOQDA</b> (Bank hisobi tekshirilmoqda)';
  if (order.status === 'approved') {
    statusBadge = '🟢 <b>TASDIQLANGAN VA QABUL QILINDI</b> (3D bosma jarayonida)';
  } else if (order.status === 'declined') {
    statusBadge = '❌ <b>RAD ETILGAN</b> (To‘lov cheki noto‘g‘ri yoki soxta)';
  }

  const orderCardText = `
📦 <b>BUYURTMA MA'LUMOTLARI: ${order.orderId}</b>

🆔 <b>Buyurtma ID:</b> <code>${order.orderId}</code>
👤 <b>Mijoz:</b> ${order.customerName || 'Noma\'lum'}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${order.customerPhone || 'Kiritilmagan'}</a>
💬 <b>Telegram nick:</b> ${tgNick !== 'Kiritilmagan' ? `<a href="https://t.me/${tgNick.replace('@', '')}">${tgNick}</a>` : '<i>Kiritilmagan</i>'}

📋 <b>Mahsulot / Detal:</b> ${order.orderTypeTitle || '3D Detal'}
🧵 <b>Material:</b> ${order.material || 'Standart PLA'}
🔢 <b>Soni:</b> ${order.quantity || 1} dona
💰 <b>Jami summa:</b> <b>${order.grandTotal || '0 so‘m'}</b>
🚚 <b>Yetkazish:</b> ${order.deliveryMethodTitle || order.deliveryMethod || 'Ustaxonadan olib ketish'}
${order.deliveryAddress ? `📍 <b>Manzil:</b> ${order.deliveryAddress}\n` : ''}${order.orderNotes ? `📝 <b>Izoh:</b> <i>"${order.orderNotes}"</i>\n` : ''}
⏱️ <b>Holat:</b> ${statusBadge}
📅 <b>Vaqt:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }) : 'Bugun'}
${order.reviewedBy ? `👨‍💼 <b>Tekshiruvchi:</b> ${order.reviewedBy}\n` : ''}
${(order.receiptImage || order.receiptPath) ? '🧾 <b>To‘lov cheki:</b> Rasm quyida ilova qilindi 👇' : '⚠️ <b>To‘lov cheki:</b> Chek yuklanmagan (kuryerga / joyida to‘lov)'}
  `.trim();

  // Boshqaruv klaviaturasi
  let inlineMarkup = null;
  if (isExclusiveAdmin) {
    inlineMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Qabul qilish (Approve)', callback_data: `approve_${order.orderId}` },
          { text: '❌ Rad etish (Decline)', callback_data: `decline_${order.orderId}` }
        ],
        [
          { text: '📞 Qo‘ng‘iroq', url: `tel:${cleanPhone}` },
          { text: '💬 Telegram', url: `https://t.me/+${cleanPhone.replace('+', '')}` }
        ]
      ]
    };
  } else {
    inlineMarkup = {
      inline_keyboard: [
        [
          { text: '📡 Dastgoh Jonli Telemetriyasi (LIVE)', callback_data: 'live' }
        ],
        [
          { text: '💬 Administrator (@any3DCubicc)', url: 'https://t.me/any3DCubicc' }
        ]
      ]
    };
  }

  const receiptSource = order.receiptImage || order.receiptPath;
  let photoSent = false;
  if (receiptSource) {
    photoSent = await sendTelegramPhoto(chatId, receiptSource, orderCardText, { reply_markup: inlineMarkup });
  }

  if (!photoSent) {
    await sendTelegramMessage(chatId, orderCardText, { reply_markup: inlineMarkup });
  }
}

export async function broadcastToAdmins(messageText, extra = {}, photoBase64 = null) {
  // Buyurtmalar va administrator ogohlantirishlari FAQAT bosh administrator @any3DCubicc ga boradi
  const targetId = EXCLUSIVE_ADMIN_CHAT_ID;
  let success = false;
  try {
    if (photoBase64) {
      success = await sendTelegramPhoto(targetId, photoBase64, messageText, extra);
    }
    if (!success) {
      success = await sendTelegramMessage(targetId, messageText, extra);
    }
  } catch (err) {
    console.error('broadcastToAdmins xatosi:', err.message);
  }
  return success ? 1 : 0;
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
    const callerId = cq.from.id;
    const callerUsername = (cq.from.username || '').toLowerCase();
    const isExclusiveAdmin = (callerId === EXCLUSIVE_ADMIN_CHAT_ID) || (callerUsername === EXCLUSIVE_ADMIN_USERNAME.toLowerCase());

    if (!isExclusiveAdmin) {
      await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: cq.id,
          text: '🚫 Ruxsat yo‘q! Faqat bosh administrator (@any3DCubicc) buyurtmalarni tasdiqlash yoki rad etish huquqiga ega.',
          show_alert: true
        })
      }).catch(() => {});
      return;
    }

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
📞 Admin: @any3DCubicc
        `.trim();
        await sendTelegramMessage(custChatId, custMsg);
      }
    }
  }
}

export async function handleUpdate(update) {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const userName = msg.from.first_name || msg.from.username || 'Foydalanuvchi';

  const callerId = msg.chat.id;
  const callerUsername = (msg.from.username || '').toLowerCase();
  const isExclusiveAdmin = (callerId === EXCLUSIVE_ADMIN_CHAT_ID) || (callerUsername === EXCLUSIVE_ADMIN_USERNAME.toLowerCase());

  // Faqat @any3DCubicc ni adminlar ro'yxatiga qo'shish
  const subs = getSubscribers();
  if (isExclusiveAdmin && !subs.some(s => s.chatId === EXCLUSIVE_ADMIN_CHAT_ID)) {
    subs.push({
      chatId: EXCLUSIVE_ADMIN_CHAT_ID,
      username: 'any3DCubicc',
      firstName: 'Any3DCubic',
      role: 'owner_admin',
      addedAt: new Date().toISOString()
    });
    saveSubscribers(subs);
  }

  const WEB_APP_URL = 'https://muhammadrizoxayrullayev-commits.github.io/t3d/';

  // 1. Boshqaruvchi Admin (@any3DCubicc) uchun maxsus klaviatura
  const adminMenuKeyboard = {
    keyboard: [
      [
        { text: '🛡️ Admin CRM & Chat', web_app: { url: `${WEB_APP_URL}?admin=any3dcubicc` } }
      ],
      [
        { text: '📦 Barcha buyurtmalar' },
        { text: '📊 Tizim holati (/status)' }
      ],
      [
        { text: '📡 Dastgoh Telemetriyasi (LIVE)' },
        { text: 'ℹ️ Yordam' }
      ]
    ],
    resize_keyboard: true
  };

  // 2. Oddiy mijozlar uchun qulay menyu
  const customerMenuKeyboard = {
    keyboard: [
      [
        { text: '🛒 3D Bosmaga Buyurtma Berish', web_app: { url: WEB_APP_URL } }
      ],
      [
        { text: '📦 Buyurtmamni Kuzatish' },
        { text: '📍 Ustaxona Lokatsiyasi' }
      ],
      [
        { text: '📡 Jonli Telemetriya (LIVE)' },
        { text: '💬 Bosh Administrator (@any3DCubicc)' }
      ]
    ],
    resize_keyboard: true
  };

  const activeKeyboard = isExclusiveAdmin ? adminMenuKeyboard : customerMenuKeyboard;

  // 1. Agar foydalanuvchi to'lov cheki rasmini yuklasa
  if (msg.photo && msg.photo.length > 0) {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    const captionNote = msg.caption ? `\n💬 <b>Izoh:</b> ${msg.caption}` : '';
    const adminNotice = `
🧾 <b>MIJOZDAN TO‘LOV CHEKI KELDI!</b>

👤 <b>Mijoz:</b> ${userName}
🆔 <b>Chat ID:</b> <code>${chatId}</code>${captionNote}
📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}

⚡ <i>Iltimos, bank hisobingizga pul tushganini tekshirib tasdiqlang yoki rad eting:</i>
    `.trim();

    // Rasm va tasdiqlash tugmalari FAQAT @any3DCubicc ga boradi
    await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: EXCLUSIVE_ADMIN_CHAT_ID,
        photo: photoId,
        caption: adminNotice,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Tasdiqlash (Qabul qilish)', callback_data: `approve_PHOTO_${Date.now()}` },
              { text: '❌ Rad etish (Fake)', callback_data: `decline_PHOTO_${Date.now()}` }
            ]
          ]
        }
      })
    }).catch(() => {});

    const userSuccess = `
🎉 <b>To‘lov chekingiz qabul qilindi!</b>

📸 Chek rasmi Toshkent 3D Ustaxonasi bosh administratori (@any3DCubicc) ga tekshirish uchun yetkazildi.
Admin chekni tasdiqlagan zahoti buyurtmangiz navbatga qo‘yiladi!
    `.trim();

    await sendTelegramMessage(chatId, userSuccess, { reply_markup: activeKeyboard });
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
Dastgoh harorati va navbatni real vaqtda ko‘rish uchun <b>"📡 Jonli Telemetriya (LIVE)"</b> tugmasini bosing.
      `.trim();
      await sendTelegramMessage(chatId, appSuccess, { reply_markup: activeKeyboard });
      return;
    } catch (e) {
      console.error('web_app_data error:', e);
    }
  }

  // 3. BUYURTMA RAQAMI ORQALI TEZKOR QIDIRUV (Masalan: "5452", "pm5452", "#T3D-UZ-5452")
  // Foydalanuvchi /start bosmasdan yoki alohida xabarda raqamni o'zini yozsa ham cheki va mahsulotini ko'rsatish
  const cleanDigits = text.replace(/\D/g, '');
  const looksLikeOrderQuery = cleanDigits.length >= 3 || 
                              text.toLowerCase().includes('t3d') || 
                              text.toLowerCase().includes('pm') || 
                              text.startsWith('#') ||
                              text.toLowerCase().startsWith('buyurtma') ||
                              text.toLowerCase().startsWith('/track') ||
                              text.toLowerCase().startsWith('/order');

  const isBuiltinNavCommand = [
    '🌐 saytni ochish', '/site', '🛒 3d bosmaga buyurtma berish',
    '📡 jonli telemetriya (live)', '📡 dastgoh telemetriyasi (live)',
    '📍 ustaxona lokatsiyasi', '💬 bosh administrator (@any3dcubicc)',
    '💬 administrator (@any3dcubicc)', '📦 barcha buyurtmalar', '📦 oxirgi buyurtmalar',
    '📦 buyurtmamni kuzatish', '/track', 'buyurtmamni kuzatish',
    '📊 statistika', '📊 tizim holati (/status)', 'ℹ️ yordam'
  ].includes(text.toLowerCase());

  if (!isBuiltinNavCommand && !text.startsWith('/start') && looksLikeOrderQuery) {
    const matchedOrder = getOrderById(cleanDigits) || getOrderById(text);
    if (matchedOrder) {
      await sendOrderDetailsToUser(chatId, matchedOrder, isExclusiveAdmin, activeKeyboard);
      return;
    } else if (cleanDigits.length >= 3 && cleanDigits.length <= 8 && text.length <= 30) {
      await sendTelegramMessage(chatId, `🔍 <b>Buyurtma topilmadi:</b> <code>#${cleanDigits}</code>\n\nIltimos, raqamni to‘g‘ri kiritganingizni tekshiring yoki saytdan yangi buyurtma bering: ${WEB_APP_URL}`, { reply_markup: activeKeyboard });
      return;
    }
  }

  // /start 5452 yoki /start pm5452 kabi deep-link bo'lsa
  if (text.startsWith('/start ') && text.length > 7 && !text.includes('live') && !text.includes('admin')) {
    const param = text.replace('/start', '').trim();
    const cleanParamDigits = param.replace(/\D/g, '');
    const matchedOrder = getOrderById(param) || (cleanParamDigits.length >= 3 ? getOrderById(cleanParamDigits) : null);
    if (matchedOrder) {
      await sendOrderDetailsToUser(chatId, matchedOrder, isExclusiveAdmin, activeKeyboard);
      return;
    } else {
      await sendTelegramMessage(chatId, `🔍 <b>Buyurtma topilmadi:</b> <code>#${param}</code>\n\nIltimos, raqamni to‘g‘ri kiritganingizni tekshiring yoki saytdan yangi buyurtma bering: ${WEB_APP_URL}`, { reply_markup: activeKeyboard });
      return;
    }
  }

  // 4. Mijoz o'z buyurtmasini kuzatish tugmasini bossa
  if (text === '📦 Buyurtmamni Kuzatish' || text.toLowerCase() === 'buyurtmamni kuzatish' || text === '/track') {
    const orders = getOrders();
    const userOrders = orders.filter(o => {
      if (callerUsername && o.customerTelegram && o.customerTelegram.toLowerCase().includes(callerUsername)) return true;
      return false;
    });

    if (userOrders.length > 0) {
      const latest = userOrders[0];
      await sendTelegramMessage(chatId, `🔍 <b>Sizning oxirgi buyurtmangiz ma'lumotlari:</b>`, { reply_markup: activeKeyboard });
      await sendOrderDetailsToUser(chatId, latest, isExclusiveAdmin, activeKeyboard);
      return;
    }

    const trackPrompt = `
📦 <b>Buyurtmangizni kuzatish:</b>

Iltimos, buyurtma raqamingizni yozib yuboring (masalan: <code>5452</code> yoki <code>#T3D-UZ-5452</code>).

Bot sizga to‘lov cheki, mahsulot tafsilotlari, narxi va tayyorlanish jarayonini bir zumda chiqarib beradi! 🚀
    `.trim();
    await sendTelegramMessage(chatId, trackPrompt, { reply_markup: activeKeyboard });
    return;
  }

  // 4. Jonli Telemetriya (LIVE) holati
  if (text.startsWith('/start live') || text === '/live' || text === '📡 Jonli Telemetriya (LIVE)' || text === '📡 Dastgoh Telemetriyasi (LIVE)') {
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

    await sendTelegramMessage(chatId, liveMsg, { reply_markup: activeKeyboard });
    return;
  }

  if (text === '📍 Ustaxona Lokatsiyasi') {
    const locMsg = `
📍 <b>Toshkent 3D Ustaxonasi Manzili:</b>

🏢 <b>Manzil:</b> Toshkent shahri, Chilonzor tumani, 9-mavze, 12-bino
🚇 <b>Mo‘ljal:</b> Novza va Chilonzor metro bekatlari oralig‘i
⏱️ <b>Ish vaqti:</b> Har kuni 09:00 dan 21:00 gacha

🗺️ <a href="https://www.google.com/maps/dir/?api=1&destination=41.272145,69.204523">Google Maps orqali marshrut</a>
🚕 <a href="https://yandex.uz/maps/?rtext=~41.272145,69.204523&rtt=auto">Yandex Maps / Go orqali marshrut</a>
    `.trim();
    await sendTelegramMessage(chatId, locMsg, { reply_markup: activeKeyboard });
    return;
  }

  if (text === '💬 Bosh Administrator (@any3DCubicc)' || text === '💬 Administrator (@any3DCubicc)') {
    const contactMsg = `
👨‍💼 <b>Toshkent 3D Ustaxonasi Bosh Administratori:</b>

Savollaringiz, chizmalar yoki nostandart buyurtmalar bo‘yicha to‘g‘ridan-to‘g‘ri bog‘lanishingiz mumkin:
🔗 <b>Telegram:</b> @any3DCubicc
    `.trim();
    await sendTelegramMessage(chatId, contactMsg, { reply_markup: activeKeyboard });
    return;
  }

  if (text === '🌐 Saytni ochish' || text === '/site' || text === '🛒 3D Bosmaga Buyurtma Berish') {
    const siteMsg = `
🌐 <b>Toshkent 3D Ustaxonasi Portali</b>

Saytni ochish uchun quyidagi tugmani bosing:
`.trim();

    const siteInline = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Mini App)', web_app: { url: WEB_APP_URL } }
        ],
        [
          { text: '🌐 Brauzerda ochish', url: WEB_APP_URL }
        ]
      ]
    };

    await sendTelegramMessage(chatId, siteMsg, { reply_markup: siteInline });
    return;
  }

  // /start buyrug'i
  if (text.startsWith('/start')) {
    if (isExclusiveAdmin) {
      const welcomeAdmin = `
👑 <b>Assalomu alaykum, Any3DCubic!</b>

Siz <b>Toshkent 3D Ustaxonasi</b> tizimining <b>Bosh Administratorisiz</b> (@any3DCubicc).
Barcha yangi buyurtmalar, to‘lov cheklari va mijozlar xabarlari <b>faqat sizga</b> keladi.

Buyurtmalarni tasdiqlash (Approve) yoki rad etish (Decline) vakolati faqat sizga berilgan.

👇 <b>Boshqaruv uchun pastdagi "🛡️ Admin CRM & Chat" tugmasini bosing:</b>
      `.trim();

      const adminInline = {
        inline_keyboard: [
          [
            { text: '🛡️ Admin CRM Portali (Mini App)', web_app: { url: `${WEB_APP_URL}?admin=any3dcubicc` } }
          ]
        ]
      };

      await sendTelegramMessage(chatId, welcomeAdmin, { reply_markup: adminMenuKeyboard });
      await sendTelegramMessage(chatId, '⚙️ <b>Tezkor Admin CRM:</b>', { reply_markup: adminInline });
      return;
    } else {
      const welcomeCustomer = `
👋 <b>Assalomu alaykum, ${userName}!</b>

<b>Toshkent 3D Ustaxonasi</b> (@Any3dCubic_bot) ga xush kelibsiz!
Bizda istalgan murakkablikdagi shesterna, avtomobil ehtiyot qismlari, muhandislik korpuslari hamda arxitektura maketlarini tezkor 3D bosmaga buyurtma berishingiz mumkin.

💡 <b>Buyurtmangiz bormi?</b> Shunchaki buyurtma raqamingizni (masalan: <code>5452</code> yoki <code>#T3D-UZ-5452</code>) yozib yuboring, bot to‘lov chekingiz, mahsulot va tayyorlanish jarayonini darhol ko‘rsatadi!

👇 <b>Yangi buyurtma berish uchun pastdagi tugmani bosing:</b>
      `.trim();

      const customerInline = {
        inline_keyboard: [
          [
            { text: '🚀 3D Bosmaga Buyurtma Berish (Mini App)', web_app: { url: WEB_APP_URL } }
          ]
        ]
      };

      await sendTelegramMessage(chatId, welcomeCustomer, { reply_markup: customerMenuKeyboard });
      await sendTelegramMessage(chatId, '🛒 <b>3D Studiya va Narx Hisoblagich:</b>', { reply_markup: customerInline });
      return;
    }
  }

  if (text === '📦 Oxirgi buyurtmalar' || text === '📦 Barcha buyurtmalar' || text === '/orders') {
    if (!isExclusiveAdmin) {
      await sendTelegramMessage(chatId, 'ℹ️ Buyurtmangizni kuzatish uchun saytdagi "Buyurtmani Kuzatish" bo‘limidan foydalaning.', { reply_markup: activeKeyboard });
      return;
    }
    const orders = getOrders();
    if (orders.length === 0) {
      await sendTelegramMessage(chatId, '📦 Hozircha yangi buyurtmalar mavjud emas.', { reply_markup: activeKeyboard });
      return;
    }
    const recent = orders.slice(0, 5);
    let orderMsg = `📦 <b>Oxirgi ${recent.length} ta buyurtma:</b>\n\n`;
    recent.forEach((ord, i) => {
      orderMsg += `${i + 1}. <b>${ord.orderId || '#T3D'}</b> — ${ord.customerName} (${ord.customerPhone})\n`;
      orderMsg += `   Detal: ${ord.orderTypeTitle} | ${ord.material} (${ord.quantity} dona)\n`;
      orderMsg += `   Summa: <b>${ord.grandTotal}</b> | Holat: <b>${ord.status || 'pending'}</b>\n\n`;
    });
    await sendTelegramMessage(chatId, orderMsg, { reply_markup: activeKeyboard });
    return;
  }

  if (text === '📊 Statistika' || text === '📊 Tizim holati (/status)' || text === '/stats' || text === '/status' || text === '/ping') {
    const orders = getOrders();
    const uptimeSec = Math.floor(process.uptime());
    const memUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const pendingOrders = orders.filter(o => !o.status || o.status === 'pending').length;
    const statsMsg = `
📊 <b>Any3D Bot 24/7 Tizim Holati:</b>

👑 <b>Bosh Administrator:</b> @any3DCubicc
🟢 <b>Holat:</b> 100% Faol (24/7 Online)
⏱️ <b>Uptime:</b> ${Math.floor(uptimeSec / 3600)} soat ${Math.floor((uptimeSec % 3600) / 60)} daq ${uptimeSec % 60} sek
🧠 <b>RAM:</b> ${memUsage} MB
📦 <b>Jami buyurtmalar:</b> ${orders.length} ta (${pendingOrders} ta tasdiq kutilmoqda)
🕒 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
    `.trim();
    await sendTelegramMessage(chatId, statsMsg, { reply_markup: activeKeyboard });
    return;
  }

  if (text === 'ℹ️ Yordam' || text === '/help') {
    const helpMsg = `
ℹ️ <b>Yordam & Ma'lumot:</b>

Ushbu bot Toshkent 3D Ustaxonasi (@Any3dCubic_bot) portali bilan integratsiya qilingan.
Bosh Administrator: @any3DCubicc

Buyruqlar:
/start — Botni qayta ishga tushirish
/live — Dastgoh jonli telemetriyasi
/site — Saytni ochish
    `.trim();
    await sendTelegramMessage(chatId, helpMsg, { reply_markup: activeKeyboard });
    return;
  }

  // Default answer
  await sendTelegramMessage(chatId, `Buyruq tushunarsiz bo'ldi. Menyudan foydalaning.`, { reply_markup: activeKeyboard });
}

export function stopBotPolling() {
  isPolling = false;
}
