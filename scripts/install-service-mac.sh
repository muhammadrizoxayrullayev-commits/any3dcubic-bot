#!/bin/bash
# Toshkent 3D Ustaxonasi (Any3D Cubic) 24/7 Mac Daemon Installer
set -e

PLIST_NAME="com.any3dcubic.bot.plist"
TARGET_DIR="$HOME/Library/LaunchAgents"
TARGET_FILE="$TARGET_DIR/$PLIST_NAME"
PROJECT_DIR="/Users/rizo/.gemini/antigravity-ide/scratch/projects/3dprinter-uz"
NODE_BIN="/Users/rizo/.local/bin/node"

mkdir -p "$TARGET_DIR"
mkdir -p "$PROJECT_DIR/logs"

# Unload existing if loaded
launchctl unload "$TARGET_FILE" 2>/dev/null || true

cat <<EOF > "$TARGET_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.any3dcubic.bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_BIN</string>
        <string>$PROJECT_DIR/server/standalone.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/bot.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/bot_error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/Users/rizo/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>
</dict>
</plist>
EOF

launchctl load "$TARGET_FILE"
echo "✅ Any3DCubic 24/7 xizmati Mac tizimiga muvaffaqiyatli o'rnatildi va ishga tushirildi!"
echo "📂 Loglar: $PROJECT_DIR/logs/bot.log"
