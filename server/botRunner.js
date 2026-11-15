import { startBotPolling } from './telegramBot.js';

console.log('🚀 Any3dCubic Telegram Bot mustaqil rejimda ishga tushirilmoqda...');
startBotPolling();

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nBot to‘xtatildi.');
  process.exit(0);
});
