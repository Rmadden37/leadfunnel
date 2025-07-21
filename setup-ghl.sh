#!/bin/bash

# GoHighLevel Setup Script for Freedom Forever Solar Landing Page
# This script helps configure email automation for form submissions

echo "🌞 Freedom Forever - GoHighLevel Email Setup"
echo "=============================================="
echo ""

echo "This script will guide you through setting up automated emails"
echo "using your professional GoHighLevel template."
echo ""

# Check if form-handler.js exists
if [ -f "form-handler.js" ]; then
    echo "✅ Found form-handler.js"
else
    echo "❌ form-handler.js not found. Make sure you're in the correct directory."
    exit 1
fi

echo ""
echo "📧 GoHighLevel Email Template Information:"
echo "   Template ID: 687d9c3fd9b8671d26069758"
echo "   Template URL: https://affiliates.gohighlevel.com/?fp_ref=arete-enterprises-llc75&email_template_share=687d9c3fd9b8671d26069758"
echo ""

read -p "Do you have your GoHighLevel API key ready? (y/n): " has_api_key

if [ "$has_api_key" != "y" ]; then
    echo ""
    echo "📝 To get your GoHighLevel API key:"
    echo "   1. Log into your GoHighLevel account"
    echo "   2. Go to Settings → API Keys"
    echo "   3. Create a new API key with email permissions"
    echo "   4. Copy the API key"
    echo ""
    read -p "Press Enter when you have your API key..."
fi

echo ""
read -p "Enter your GoHighLevel API Key: " ghl_api_key

echo ""
read -p "Do you have a GoHighLevel webhook URL set up? (y/n): " has_webhook

if [ "$has_webhook" != "y" ]; then
    echo ""
    echo "🔗 To create a GoHighLevel webhook:"
    echo "   1. Go to Automations → Workflows in GoHighLevel"
    echo "   2. Create a new workflow triggered by webhook"
    echo "   3. Add an email action using template ID: 687d9c3fd9b8671d26069758"
    echo "   4. Copy the webhook URL"
    echo ""
    read -p "Press Enter when you have your webhook URL..."
fi

echo ""
read -p "Enter your GoHighLevel Webhook URL: " ghl_webhook_url

echo ""
echo "🔧 Updating form-handler.js configuration..."

# Create a backup
cp form-handler.js form-handler.js.backup

# Update the configuration in form-handler.js
sed -i.tmp "s|webhookUrl: 'YOUR_GHL_WEBHOOK_URL'|webhookUrl: '$ghl_webhook_url'|g" form-handler.js
sed -i.tmp "s|apiKey: 'YOUR_GHL_API_KEY'|apiKey: '$ghl_api_key'|g" form-handler.js

# Clean up temp files
rm form-handler.js.tmp

echo "✅ Configuration updated!"
echo ""

echo "📋 Summary of Changes:"
echo "   ✓ API Key configured"
echo "   ✓ Webhook URL configured"
echo "   ✓ Template ID: 687d9c3fd9b8671d26069758 (already set)"
echo "   ✓ Backup created: form-handler.js.backup"
echo ""

echo "🧪 Testing Configuration..."
echo "   1. Open your website in a browser"
echo "   2. Submit the form with a test email address"
echo "   3. Check that the email is received"
echo "   4. Verify GoHighLevel shows the new contact"
echo ""

echo "📊 Monitoring:"
echo "   • Check browser console for any JavaScript errors"
echo "   • Check GoHighLevel workflow execution logs"
echo "   • Monitor email delivery rates in GoHighLevel"
echo ""

echo "🎯 Next Steps:"
echo "   1. Test the form submission with your own email"
echo "   2. Customize the email template in GoHighLevel if needed"
echo "   3. Set up additional automation workflows if desired"
echo "   4. Monitor lead capture and email delivery"
echo ""

echo "✨ Setup Complete!"
echo ""
echo "Your Freedom Forever landing page now has automated email delivery"
echo "using your professional GoHighLevel template. Every form submission"
echo "will automatically send a welcome email to the prospect."
echo ""
echo "If you need help, check the GHL_EMAIL_SETUP.md file for troubleshooting."