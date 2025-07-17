#!/bin/bash

# Solar Maps Installation and Setup Script
# This script helps set up the Google Maps Solar API integration

echo "🌞 Solar Maps Setup Assistant 🌞"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "solar_maps.js" ]; then
    echo "❌ Error: solar_maps.js not found. Please run this script from the project directory."
    exit 1
fi

echo "✅ Found solar_maps.js - we're in the right directory!"
echo ""

# Function to prompt for API key
setup_api_key() {
    echo "🔑 Google Cloud API Key Setup"
    echo "-----------------------------"
    echo "You need a Google Cloud Platform API key with the following APIs enabled:"
    echo "  • Maps JavaScript API"
    echo "  • Geocoding API"
    echo "  • Solar API"
    echo ""
    
    read -p "Enter your Google Cloud API key: " api_key
    
    if [ -z "$api_key" ]; then
        echo "❌ No API key provided. Exiting..."
        exit 1
    fi
    
    echo ""
    echo "🔄 Updating files with your API key..."
    
    # Update solar_maps.js
    if command -v sed >/dev/null 2>&1; then
        sed -i '' "s/YOUR_API_KEY/$api_key/g" solar_maps.js
        echo "✅ Updated solar_maps.js"
        
        # Update index.html if it exists
        if [ -f "index.html" ]; then
            sed -i '' "s/YOUR_API_KEY/$api_key/g" index.html
            echo "✅ Updated index.html"
        fi
        
        # Update test_solar.html if it exists
        if [ -f "test_solar.html" ]; then
            sed -i '' "s/YOUR_API_KEY/$api_key/g" test_solar.html
            echo "✅ Updated test_solar.html"
        fi
    else
        echo "❌ sed command not found. Please manually replace 'YOUR_API_KEY' with your actual API key in:"
        echo "   - solar_maps.js (3 locations)"
        echo "   - index.html (1 location)"
        echo "   - test_solar.html (1 location)"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking Prerequisites"
    echo "------------------------"
    
    # Check if curl is available
    if command -v curl >/dev/null 2>&1; then
        echo "✅ curl is available"
    else
        echo "❌ curl is not available - some tests may not work"
    fi
    
    # Check if we can create a simple HTTP server
    if command -v python3 >/dev/null 2>&1; then
        echo "✅ Python 3 is available (can serve files locally)"
    elif command -v python >/dev/null 2>&1; then
        echo "✅ Python is available (can serve files locally)"
    elif command -v npx >/dev/null 2>&1; then
        echo "✅ npx is available (can serve files locally)"
    else
        echo "⚠️  No local server available - you'll need to serve files via a web server"
    fi
    
    echo ""
}

# Function to validate API key
validate_api_key() {
    echo "🧪 Testing API Key"
    echo "-----------------"
    
    # Extract API key from solar_maps.js
    api_key=$(grep -o 'key=[^&"]*' solar_maps.js | head -1 | cut -d'=' -f2)
    
    if [ "$api_key" = "YOUR_API_KEY" ]; then
        echo "❌ API key not set. Please run the setup first."
        return 1
    fi
    
    echo "Testing Geocoding API..."
    response=$(curl -s "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=$api_key")
    
    if echo "$response" | grep -q '"status" : "OK"'; then
        echo "✅ Geocoding API is working"
    else
        echo "❌ Geocoding API test failed. Check your API key and permissions."
        echo "Response: $response"
        return 1
    fi
    
    echo "Testing Solar API..."
    response=$(curl -s "https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=37.4419&location.longitude=-122.1419&key=$api_key")
    
    if echo "$response" | grep -q '"name"'; then
        echo "✅ Solar API is working"
    else
        echo "❌ Solar API test failed. Make sure the Solar API is enabled in your Google Cloud project."
        echo "Response: $response"
        return 1
    fi
    
    echo "✅ All APIs are working correctly!"
    echo ""
}

# Function to start local server
start_server() {
    echo "🚀 Starting Local Development Server"
    echo "-----------------------------------"
    
    port=8000
    
    if command -v python3 >/dev/null 2>&1; then
        echo "Starting Python 3 HTTP server on port $port..."
        echo "Open http://localhost:$port in your browser"
        echo "Press Ctrl+C to stop the server"
        echo ""
        python3 -m http.server $port
    elif command -v python >/dev/null 2>&1; then
        echo "Starting Python HTTP server on port $port..."
        echo "Open http://localhost:$port in your browser"
        echo "Press Ctrl+C to stop the server"
        echo ""
        python -m SimpleHTTPServer $port
    elif command -v npx >/dev/null 2>&1; then
        echo "Starting Node.js HTTP server on port $port..."
        echo "Open http://localhost:$port in your browser"
        echo "Press Ctrl+C to stop the server"
        echo ""
        npx http-server -p $port
    else
        echo "❌ No suitable HTTP server found."
        echo "Please install Python or Node.js, or serve the files through another web server."
        echo ""
        echo "Alternative: Open index.html directly in your browser (some features may not work)."
    fi
}

# Function to show usage instructions
show_usage() {
    echo "📖 Usage Instructions"
    echo "--------------------"
    echo ""
    echo "Files in this project:"
    echo "  • index.html - Main application with full UI"
    echo "  • test_solar.html - Simple test page for debugging"
    echo "  • solar_maps.js - Core Google Maps + Solar API integration"
    echo "  • styles.css - Styling for the application"
    echo ""
    echo "To test the solar analysis:"
    echo "  1. Open the local server URL in your browser"
    echo "  2. Enter a valid US address (works best with specific street addresses)"
    echo "  3. Click 'Analyze Solar Potential' or 'Analyze' button"
    echo "  4. View the interactive map with solar data overlay"
    echo ""
    echo "Good test addresses:"
    echo "  • 1600 Amphitheatre Parkway, Mountain View, CA"
    echo "  • 1 Apple Park Way, Cupertino, CA"
    echo "  • 410 Terry Ave N, Seattle, WA"
    echo ""
    echo "Troubleshooting:"
    echo "  • If maps don't load: Check browser console for API key errors"
    echo "  • If solar data is missing: Solar API coverage is limited to certain regions"
    echo "  • If heatmap doesn't appear: GeoTIFF data may not be available for all locations"
    echo ""
}

# Main menu
main_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1. Set up API key"
    echo "2. Check prerequisites"
    echo "3. Test API key"
    echo "4. Start local server"
    echo "5. Show usage instructions"
    echo "6. Exit"
    echo ""
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            setup_api_key
            echo ""
            main_menu
            ;;
        2)
            check_prerequisites
            main_menu
            ;;
        3)
            validate_api_key
            main_menu
            ;;
        4)
            start_server
            ;;
        5)
            show_usage
            main_menu
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            echo ""
            main_menu
            ;;
    esac
}

# Start the script
check_prerequisites
main_menu
