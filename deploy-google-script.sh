#!/bin/bash

# Google Apps Script Deployment Helper
# This script helps set up the Google Apps Script for automated email delivery

echo "🚀 Google Apps Script Email Automation Setup"
echo "=============================================="
echo

# Step 1: Instructions for Google Apps Script
echo "📝 STEP 1: Create Google Apps Script Project"
echo "1. Go to script.google.com"
echo "2. Click 'New project'"
echo "3. Copy the contents of 'google-apps-script.js' into the editor"
echo "4. Save the project (Ctrl/Cmd + S)"
echo
read -p "Press Enter when you've completed Step 1..."

# Step 2: Instructions for Google Sheets
echo
echo "📊 STEP 2: Create Google Sheets for Lead Storage"
echo "1. Go to sheets.google.com"
echo "2. Create a new spreadsheet"
echo "3. Name it 'Solar Leads'"
echo "4. Copy the spreadsheet ID from the URL"
echo "   Example: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit"
echo
read -p "Enter your Google Sheets ID: " SHEETS_ID

# Step 3: Get user's email
echo
echo "📧 STEP 3: Configure Notification Email"
read -p "Enter your email for lead notifications: " USER_EMAIL

# Step 4: Update the Google Apps Script file with user's info
echo
echo "⚙️  STEP 4: Updating Configuration..."

# Create a temporary config file
cat > /tmp/gas-config.js << EOF
// Configuration - UPDATED BY SETUP SCRIPT
const SPREADSHEET_ID = '$SHEETS_ID';
const YOUR_EMAIL = '$USER_EMAIL';
EOF

# Show the user what to update in their Google Apps Script
echo
echo "📋 STEP 4: Update Your Google Apps Script"
echo "Replace these lines in your Google Apps Script:"
echo "----------------------------------------"
cat /tmp/gas-config.js
echo "----------------------------------------"
echo
read -p "Press Enter when you've updated the configuration in Google Apps Script..."

# Step 5: Deployment instructions
echo
echo "🌐 STEP 5: Deploy as Web App"
echo "1. In Google Apps Script, click 'Deploy' → 'New deployment'"
echo "2. Choose type: 'Web app'"
echo "3. Description: 'Solar Form Handler'"
echo "4. Execute as: 'Me'"
echo "5. Who has access: 'Anyone'"
echo "6. Click 'Deploy'"
echo "7. Copy the Web App URL"
echo
read -p "Enter your Google Apps Script Web App URL: " WEB_APP_URL

# Step 6: Update the form handler
echo
echo "🔧 STEP 6: Updating Form Handler..."

# Update the form-handler.js file
sed -i '' "s|https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec|$WEB_APP_URL|g" form-handler.js

echo "✅ Form handler updated with your Web App URL!"

# Final instructions
echo
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo "Your Google Apps Script is now configured to:"
echo "✅ Save leads to Google Sheets"
echo "✅ Send you email notifications"
echo "✅ Send automated emails to users"
echo "✅ Use Gmail as backup email service"
echo
echo "🧪 TESTING:"
echo "1. Open index.html in your browser"
echo "2. Fill out and submit the form"
echo "3. Check your Google Sheets for the new lead"
echo "4. Check your email for the notification"
echo
echo "📁 Files updated:"
echo "- form-handler.js (Web App URL configured)"
echo
echo "📖 For troubleshooting, see: GOOGLE_APPS_SCRIPT_SETUP.md"

# Clean up
rm /tmp/gas-config.js

echo
echo "🚀 Your solar landing page is ready for automated email delivery!"
