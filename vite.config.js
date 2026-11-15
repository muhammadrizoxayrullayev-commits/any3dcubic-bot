import { defineConfig } from 'vite';
import { 
  startBotPolling, 
  notifyNewOrder, 
  broadcastToAdmins, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  getOrderMessages, 
  saveOrderMessage 
} from './server/telegramBot.js';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    {
      name: 'telegram-bot-integration',
      configureServer(server) {
        // Standalone daemon port 3000 da ishlamayotgan bo'lsagina pollingni boshlash
        fetch('http://localhost:3000/health').catch(() => {
          console.log('Standalone server topilmadi, Vite ichida polling yoqilmoqda...');
          startBotPolling();
        });

        // Custom API Middleware (Zaxira uchun)
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/submit-order' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const orderData = JSON.parse(body || '{}');
                console.log('📦 Yangi buyurtma qabul qilindi:', orderData.orderId);
                const result = await notifyNewOrder(orderData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, ...result }));
              } catch (err) {
                console.error('API Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }

          if (req.url?.startsWith('/api/order-status') && req.method === 'GET') {
            const parsed = new URL(req.url, 'http://localhost:5173');
            const id = parsed.searchParams.get('id');
            const order = getOrderById(id);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              ok: true,
              found: Boolean(order),
              status: order ? order.status : 'pending',
              order: order || null
            }));
            return;
          }

          // Admin CRM: Barcha mijozlar va buyurtmalar ro'yxati
          if (req.url === '/api/admin-orders' && req.method === 'GET') {
            const orders = getOrders();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              ok: true,
              orders
            }));
            return;
          }

          // Jonli Chat: Xabarlarni olish
          if (req.url?.startsWith('/api/chat-messages') && req.method === 'GET') {
            const parsed = new URL(req.url, 'http://localhost:5173');
            const orderId = parsed.searchParams.get('orderId');
            const messages = getOrderMessages(orderId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              ok: true,
              messages
            }));
            return;
          }

          // Jonli Chat: Yangi xabar yuborish (Mijoz <-> Admin)
          if (req.url === '/api/send-message' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { orderId, sender, senderName, text } = JSON.parse(body || '{}');
                if (!orderId || !text) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ ok: false, error: 'orderId and text required' }));
                  return;
                }
                const savedMsg = saveOrderMessage(orderId, { sender, senderName, text });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, message: savedMsg }));
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: e.message }));
              }
            });
            return;
          }

          if (req.url === '/api/review-order' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { orderId, action } = JSON.parse(body || '{}');
                const newStatus = action === 'approve' ? 'approved' : 'declined';
                const updated = updateOrderStatus(orderId, newStatus, {
                  reviewedBy: 'Admin (Test / Simulyatsiya)',
                  reviewAction: action === 'approve' ? 'tasdiqlandi' : 'rad_etildi'
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, status: newStatus, order: updated }));
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: e.message }));
              }
            });
            return;
          }

          if (req.url === '/api/bot-status' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              ok: true,
              botUsername: 'Any3dCubic_bot',
              status: 'online'
            }));
            return;
          }

          next();
        });
      }
    }
  ]
});
