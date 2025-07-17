#!/bin/bash

# Quick API Key Fix Script
echo "🔧 Quick API Key Fix"
echo "==================="

if [ $# -eq 0 ]; then
    echo "Usage: ./fix_api_key.sh YOUR_ACTUAL_API_KEY"
    echo ""
    echo "This script will replace 'YOUR_API_KEY' with your actual Google Cloud API key"
    echo "in all necessary files."
    echo ""
    echo "Example:"
    echo "  ./fix_api_key.sh AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

API_KEY="$1"

echo "🔄 Replacing API keys in files..."

# Update solar_maps.js
if [ -f "solar_maps.js" ]; then
    sed -i '' "s/YOUR_API_KEY/$API_KEY/g" solar_maps.js
    echo "✅ Updated solar_maps.js"
else
    echo "❌ solar_maps.js not found"
fi

# Update index.html
if [ -f "index.html" ]; then
    sed -i '' "s/YOUR_API_KEY/$API_KEY/g" index.html
    echo "✅ Updated index.html"
else
    echo "❌ index.html not found"
fi

# Update test_solar.html
if [ -f "test_solar.html" ]; then
    sed -i '' "s/YOUR_API_KEY/$API_KEY/g" test_solar.html
    echo "✅ Updated test_solar.html"
else
    echo "⚠️  test_solar.html not found (optional)"
fi

# Update solar_maps_advanced.js
if [ -f "solar_maps_advanced.js" ]; then
    sed -i '' "s/YOUR_API_KEY/$API_KEY/g" solar_maps_advanced.js
    echo "✅ Updated solar_maps_advanced.js"
else
    echo "⚠️  solar_maps_advanced.js not found (optional)"
fi

echo ""
echo "🎉 API key replacement complete!"
echo ""
echo "Next steps:"
echo "1. Start a local server: python3 -m http.server 8000"
echo "2. Open http://localhost:8000 in your browser"
echo "3. Test with an address like: '1600 Amphitheatre Parkway, Mountain View, CA'"
echo ""
