import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  startBotPolling,
  notifyNewOrder,
  broadcastToAdmins,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderMessages,
  saveOrderMessage
} from './telegramBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const DATA_DIR = path.join(projectRoot, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

function getProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    console.error('getProducts error:', e.message);
  }
  return [];
}

function saveProducts(products) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('saveProducts error:', e.message);
    return false;
  }
}

// Load environment variables safely
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

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const startTime = Date.now();

// Global Crash Guards - Hech qanday xato jarayonni to'xtata olmaydi
process.on('uncaughtException', (err) => {
  console.error('🛡️ [Kutilmagan xato ushlandi (uncaughtException)]:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('🛡️ [Kutilmagan Promise rad etildi (unhandledRejection)]:', reason);
});

// Helper for CORS & JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return true;
  }
  return false;
}

// Read body helper
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) { // 15MB limit for base64 receipts
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  if (handleCors(req, res)) return;

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // 1. Health check & 24/7 status
  if (pathname === '/health' || pathname === '/ping' || pathname === '/') {
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();
    return sendJSON(res, 200, {
      status: 'ok',
      service: 'Toshkent 3D Ustaxonasi (Any3D Cubic)',
      bot: '@Any3dCubic_bot',
      uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
      uptimeSeconds: uptimeSec,
      memoryRssMB: Math.round(memUsage.rss / 1024 / 1024),
      time: new Date().toISOString(),
      timestamp: Date.now()
    });
  }

  // 2. Submit order API
  if (pathname === '/api/submit-order' && req.method === 'POST') {
    try {
      const orderData = await readBody(req);
      console.log('📦 Yangi buyurtma qabul qilindi:', orderData.orderId);
      const result = await notifyNewOrder(orderData);
      return sendJSON(res, 200, { ok: true, ...result });
    } catch (err) {
      console.error('API submit-order xatosi:', err);
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 3. Order status check API
  if (pathname === '/api/order-status' && req.method === 'GET') {
    const orderId = urlObj.searchParams.get('id');
    if (!orderId) {
      return sendJSON(res, 400, { ok: false, error: 'Missing order id' });
    }
    const order = getOrderById(orderId);
    if (!order) {
      return sendJSON(res, 404, { ok: false, error: 'Order not found', status: 'unknown' });
    }
    return sendJSON(res, 200, {
      ok: true,
      found: true,
      order,
      orderId: order.orderId,
      status: order.status || 'pending',
      reviewedBy: order.reviewedBy || null,
      reviewAction: order.reviewAction || null
    });
  }

  // 4. Admin orders list API
  if (pathname === '/api/admin-orders' && req.method === 'GET') {
    try {
      const orders = getOrders();
      return sendJSON(res, 200, { ok: true, orders });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 5. Admin review order API (Approve / Decline)
  if (pathname === '/api/review-order' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { orderId, action, reviewerName } = body;
      if (!orderId || !action) {
        return sendJSON(res, 400, { ok: false, error: 'Missing orderId or action' });
      }
      const newStatus = action === 'approve' ? 'approved' : 'declined';
      const updated = updateOrderStatus(orderId, newStatus, {
        reviewedBy: reviewerName || 'Admin CRM Veb',
        reviewAction: action
      });
      return sendJSON(res, 200, { ok: true, order: updated });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 6. Get order chat messages API
  if (pathname === '/api/chat-messages' && req.method === 'GET') {
    const orderId = urlObj.searchParams.get('orderId');
    if (!orderId) {
      return sendJSON(res, 400, { ok: false, error: 'Missing orderId' });
    }
    const messages = getOrderMessages(orderId);
    return sendJSON(res, 200, { ok: true, messages });
  }

  // 7. Send chat message API
  if (pathname === '/api/send-message' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { orderId, sender, senderName, text } = body;
      if (!orderId || !text) {
        return sendJSON(res, 400, { ok: false, error: 'Missing orderId or text' });
      }
      const saved = saveOrderMessage(orderId, { sender, senderName, text });
      return sendJSON(res, 200, { ok: true, message: saved });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 8. Creality Shop products list API
  if (pathname === '/api/products' && req.method === 'GET') {
    const products = getProducts();
    return sendJSON(res, 200, { ok: true, products });
  }

  // 9. Update product price/details API (Admin PIN protected)
  if (pathname === '/api/update-product' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { pin, productId, priceUZS, priceUSD, inStock, stockStatus, badge, name } = body;
      
      // Faqat to'g'ri PIN kod (083010) bilan kirganlar narxni o'zgartira oladi
      if (pin !== '083010') {
        return sendJSON(res, 403, { ok: false, error: 'Ruxsat yo‘q! Noto‘g‘ri PIN kod.' });
      }

      if (!productId) {
        return sendJSON(res, 400, { ok: false, error: 'Missing productId' });
      }

      const products = getProducts();
      const idx = products.findIndex(p => p.id === productId);
      if (idx === -1) {
        return sendJSON(res, 404, { ok: false, error: 'Mahsulot topilmadi' });
      }

      if (priceUZS !== undefined) products[idx].priceUZS = Number(priceUZS);
      if (priceUSD !== undefined) products[idx].priceUSD = Number(priceUSD);
      if (inStock !== undefined) products[idx].inStock = Boolean(inStock);
      if (stockStatus !== undefined) products[idx].stockStatus = stockStatus;
      if (badge !== undefined) products[idx].badge = badge;
      if (name !== undefined) products[idx].name = name;
      products[idx].updatedAt = new Date().toISOString();

      saveProducts(products);
      console.log(`🏷️ Mahsulot narxi yangilandi: ${products[idx].name} -> ${products[idx].priceUZS} so'm`);
      return sendJSON(res, 200, { ok: true, product: products[idx] });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 10. Creality Shop order API
  if (pathname === '/api/shop-order' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { productId, productName, priceUZS, customerName, customerPhone, customerTelegram, deliveryAddress, orderNotes } = body;
      
      const orderId = '#3D-' + Math.floor(1000 + Math.random() * 9000);
      const cleanPhone = (customerPhone || '').replace(/[^0-9+]/g, '');

      const shopOrder = {
        orderId,
        customerName: customerName || 'Mijoz',
        customerPhone: customerPhone || 'Kiritilmagan',
        customerTelegram: customerTelegram || '',
        deliveryAddress: deliveryAddress || '',
        orderTypeTitle: `💎 3D Model: ${productName || 'Creality Cloud Modeli'}`,
        material: 'Yuqori aniqlikdagi 3D Bosma (PLA/PETG/Silk)',
        quantity: 1,
        grandTotal: `${Number(priceUZS || 0).toLocaleString('uz-UZ').replace(/,/g, ' ')} so‘m`,
        turnaround: '1-2 kun ichida tayyor',
        deliveryMethodTitle: '🛵 Yetkazib berish / Ustaxonadan olib ketish',
        orderNotes: orderNotes || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const result = await notifyNewOrder(shopOrder);
      return sendJSON(res, 200, { ok: true, orderId, ...result });
    } catch (err) {
      return sendJSON(res, 500, { ok: false, error: err.message });
    }
  }

  // 404 Not Found
  return sendJSON(res, 404, { ok: false, error: 'Not found' });
});

// Start Server & Bot
server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Any3D Cubic 24/7 Standalone Server ishga tushdi!`);
  console.log(`📡 URL: http://${HOST}:${PORT}`);
  console.log(`🕒 Ishga tushgan vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`);
  console.log(`======================================================\n`);

  // Start Telegram bot long-polling with resilience
  startBotPolling();

  // Self-Ping Keep-Alive for Free Cloud Services (Render, Koyeb, Glitch, etc.)
  const publicUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (publicUrl) {
    console.log(`⚡ 24/7 Keep-Alive avtomatik yoqildi: ${publicUrl}/health`);
    setInterval(async () => {
      try {
        const pingRes = await fetch(`${publicUrl}/health`, { signal: AbortSignal.timeout(10000) });
        if (pingRes.ok) {
          console.log(`💓 [Keep-Alive]: Server o‘z-o‘zini yangiladi (${new Date().toLocaleTimeString('uz-UZ')})`);
        }
      } catch (pingErr) {
        console.warn(`[Keep-Alive ogohlantirish]:`, pingErr.message);
      }
    }, 8 * 60 * 1000); // Har 8 daqiqada (Render uyqu chegarasi 15 daqiqa)
  }
});
