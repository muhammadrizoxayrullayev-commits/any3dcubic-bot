#!/bin/bash
# Toshkent 3D Ustaxonasi (Any3D Cubic) 24/7 Mac Daemon Uninstaller
set -e

PLIST_NAME="com.any3dcubic.bot.plist"
TARGET_FILE="$HOME/Library/LaunchAgents/$PLIST_NAME"

if [ -f "$TARGET_FILE" ]; then
    launchctl unload "$TARGET_FILE" 2>/dev/null || true
    rm -f "$TARGET_FILE"
    echo "🛑 Any3DCubic 24/7 xizmati to'xtatildi va o'chirildi."
else
    echo "ℹ️ Xizmat o'rnatilmagan."
fi
