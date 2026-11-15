#!/bin/bash
# Check status of Any3DCubic Bot
PROJECT_DIR="/Users/rizo/.gemini/antigravity-ide/scratch/projects/3dprinter-uz"

echo "=== Any3DCubic 24/7 Bot Holati ==="
echo ""
echo "1. HTTP / Health Check:"
curl -s http://localhost:3000/health || echo "Server localhost:3000 da ishlamayapti"
echo ""
echo ""
echo "2. Jarayonlar (node):"
ps aux | grep "[s]tandalone.js" || ps aux | grep "[t]elegramBot.js" || echo "Aktiv bot jarayoni topilmadi"
echo ""
echo "3. Oxirgi loglar:"
if [ -f "$PROJECT_DIR/logs/bot.log" ]; then
    tail -n 15 "$PROJECT_DIR/logs/bot.log"
else
    echo "Log fayli hali mavjud emas."
fi
