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
