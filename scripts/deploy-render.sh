#!/bin/bash
# Render.com 1-Click Cloud Deployer
REPO_URL="https://github.com/muhammadrizoxayrullayev-commits/any3dcubic-bot"
DEPLOY_URL="https://render.com/deploy?repo=$REPO_URL"

echo "======================================================"
echo "🚀 Any3DCubic Botni Render.com 24/7 Bulutiga Joylash"
echo "======================================================"
echo ""
echo "🔗 1-Bosqich: Render 1-Click Deploy sahifasi ochilmoqda..."
echo "👉 Havola: $DEPLOY_URL"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$DEPLOY_URL"
elif which xdg-open > /dev/null; then
  xdg-open "$DEPLOY_URL"
fi

echo "✅ Brauzeringizda Render sahifasi ochildi!"
echo "👇 Keyingi qadamlar:"
echo "1. Render'ga GitHub profilingiz orqali kiring (Sign in with GitHub)."
echo "2. render.yaml barcha sozlamalarni avtomatik to'ldiradi."
echo "3. Sahifa pastidagi ko'k 'Apply' (yoki 'Create Web Service') tugmasini bosing."
echo "4. Taxminan 1 daqiqada botingiz 24/7 rejimda bulutda ishga tushadi!"
echo ""
