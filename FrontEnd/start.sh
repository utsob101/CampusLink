#!/bin/bash

echo "🚀 Starting CampusLink Frontend"
echo ""
echo "📝 Make sure the backend is running first!"
echo "   In another terminal: cd Backend && npm run dev"
echo ""
echo "📱 The app will automatically use the IP from server-config.json"
echo "   If the backend is running, the IP will be auto-detected."
echo ""

# Check if server-config.json exists
if [ -f "server-config.json" ]; then
  API_BASE=$(grep -o '"apiBase": *"[^"]*"' server-config.json | sed 's/"apiBase": *"\([^"]*\)"/\1/')
  echo "✅ Backend config found: $API_BASE"
else
  echo "⚠️  No server-config.json found. Start the backend first!"
fi

echo ""
echo "Starting Expo..."
npm start
