# Google Apps Script Email Automation Setup Guide

## Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. Replace the default code with the contents of `google-apps-script.js`

## Step 2: Create Google Sheets for Lead Storage

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Solar Leads" or similar
4. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL/edit#gid=0`
   - The ID is: `1ABC123DEF456GHI789JKL`

## Step 3: Configure the Script

1. In your Google Apps Script project, update this constant:
   ```javascript
   const SPREADSHEET_ID = '12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI'; // ✅ Already set!
   const YOUR_EMAIL = 'your-notification-email@domain.com'; // Update with your email
   ```

   **Note:** Your Google Sheets ID is already configured! Just update YOUR_EMAIL.

## Step 4: Deploy as Web App

1. In Google Apps Script, click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Description: "Solar Form Handler"
4. Execute as: "Me (your-email@gmail.com)"
5. Who has access: "Anyone"
6. Click "Deploy"
7. **IMPORTANT**: Copy the Web App URL that's generated

## Step 5: Update Your Form Handler

1. Open `form-handler.js`
2. Replace the placeholder URL with your Google Apps Script Web App URL:
   ```javascript
   // Replace this URL with your Google Apps Script Web App URL
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```

## Step 6: Test the System

1. Open your `index.html` file in a browser
2. Fill out and submit the form
3. Check your Google Sheets - a new row should appear
4. Check your email for the notification
5. The user should receive an automated email

## Features Included

✅ **Lead Storage**: All form submissions stored in Google Sheets
✅ **Email Notifications**: You get notified of each lead
✅ **Automated User Emails**: Professional welcome email sent to users
✅ **Gmail Fallback**: Uses Gmail if other email services fail
✅ **Error Handling**: Comprehensive error logging and recovery

## Troubleshooting

### Common Issues:

1. **"Permission denied" error**:
   - Make sure you set "Execute as: Me" and "Who has access: Anyone"
   - Try redeploying the script

2. **Form not submitting**:
   - Check browser console for errors
   - Verify the Web App URL is correct in `form-handler.js`

3. **No emails received**:
   - Check spam folder
   - Verify your email address in the script
   - Check Google Apps Script execution transcript for errors

4. **Spreadsheet not updating**:
   - Verify the SPREADSHEET_ID is correct
   - Make sure the Google Sheet exists and is accessible

### Testing the Script Directly:

1. In Google Apps Script, go to "Executions" to see logs
2. Use the "Run" button to test individual functions
3. Check the execution transcript for detailed error messages

## Email Template

The automated email uses the professional Freedom Forever template with:
- Company branding and logo
- Professional welcome message
- Contact information
- Clean, mobile-responsive design

## Security Notes

- The Web App URL is public but only accepts POST requests with valid data
- No sensitive information is exposed in the client-side code
- All processing happens securely in Google's servers
