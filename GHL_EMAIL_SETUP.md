# Email Automation Setup Guide

## 🚀 QUICK START - GoHighLevel Integration

**Your beautiful Freedom Forever email template is ready!**

### Step 1: Run the Setup Script
```bash
./setup-ghl.sh
```

### Step 2: Get Your GoHighLevel Credentials
1. **API Key**: Settings → API Keys → Create new key
2. **Webhook URL**: Automations → Workflows → Create webhook workflow

### Step 3: Test Your Setup
1. Submit your form with your email address
2. Check that you receive the professional Freedom Forever welcome email
3. Verify the contact appears in your GoHighLevel account

**That's it!** Every form submission will now automatically send your professional email.

---

## Overview
This guide provides multiple options to set up automated email delivery for every solar form submission. Choose the option that best fits your technical setup and preferences.

## Email Template Details
- **GoHighLevel Template ID**: `687d9c3fd9b8671d26069758`
- **Template URL**: https://affiliates.gohighlevel.com/?fp_ref=arete-enterprises-llc75&email_template_share=687d9c3fd9b8671d26069758
- **Professional Template**: Beautiful Freedom Forever branded email with your signature
- **Template File**: `ghl-email-template.html` (saved locally for reference)

## Setup Options (Choose One)

### Option 1: GoHighLevel Integration (Recommended for GHL Users)

**Pros**: Professional automation platform, advanced tracking, CRM integration
**Cons**: Requires GoHighLevel subscription and technical setup

1. **Get API Key**:
   - Log into your GoHighLevel account
   - Go to Settings → API Keys
   - Create a new API key with email permissions
   - Copy the API key

2. **Set up Webhook**:
   - Go to Automations → Workflows
   - Create a new workflow triggered by webhook
   - Set up email action using template ID: `687d9c3fd9b8671d26069758`
   - Copy the webhook URL

3. **Update Configuration**:
   Edit `form-handler.js` and replace:
   ```javascript
   this.ghlConfig = {
       webhookUrl: 'YOUR_ACTUAL_WEBHOOK_URL_HERE',
       emailTemplateId: '687d9c3fd9b8671d26069758',
       apiKey: 'YOUR_GHL_API_KEY_HERE'
   };
   ```

### Option 2: Google Apps Script with Gmail (Easiest)

**Pros**: Free, uses existing Google account, simple setup
**Cons**: Gmail sending limits, basic tracking

1. **Update Google Apps Script**:
   - The script already includes email functionality
   - Just update the `YOUR_EMAIL` constant with your Gmail address
   - The system will automatically send welcome emails to form submitters

2. **Email Template**:
   - Uses the professional template built into the script
   - Includes personalization with user's name, address, and phone
   - Solar-specific content with federal incentive messaging

3. **No Additional Setup Required**:
   - Emails are sent automatically when the Google Apps Script processes form submissions

### Option 3: Third-Party Email Services

**Popular Options**:
- **Mailchimp**: Great for newsletters and automation
- **ConvertKit**: Designed for creators and businesses  
- **ActiveCampaign**: Advanced automation and CRM features
- **Zapier**: Connect to any email service

**Setup**:
1. Choose your preferred service
2. Create account and email template
3. Set up API integration or Zapier connection
4. Update `form-handler.js` with service-specific code

### Option 4: Simple SMTP Email Service

**Services**: SendGrid, Mailgun, Amazon SES
**Best for**: Developers comfortable with SMTP setup

## Current Implementation Status

✅ **Form Handler**: Updated with GoHighLevel integration code  
✅ **Google Apps Script**: Includes Gmail backup functionality  
✅ **Email Template**: Professional solar-specific template created  
✅ **Documentation**: Complete setup guides for all options  

## Quick Start (Recommended)

1. **Use Google Apps Script Option** (easiest):
   - Already built into the existing system
   - Just deploy the Google Apps Script with your email address
   - Emails will be sent automatically

2. **Test the System**:
   - Submit a test form with your email
   - Check that you receive the welcome email
   - Verify all personalization is working

## Email Content Overview

All email templates include:
- Personal greeting with user's name
- Confirmation of their address and phone
- Federal incentive deadline messaging  
- What to expect next (phone call from Ryan)
- Key benefits and statistics
- Contact information
- Professional branding
- Call-to-action buttons

## Data Sent to Email System

- **firstName**: User's first name
- **email**: User's email address  
- **phone**: User's phone number
- **fullAddress**: Complete address string
- **address**: Street address only
- **city**: City name
- **zip**: ZIP code
- **source**: Form source identifier
- **timestamp**: Submission timestamp

## Testing

1. **Test Form Submission**:
   - Use a real email address you can access
   - Fill out the form completely
   - Submit the form

2. **Verify Email Receipt**:
   - Check inbox (and spam folder)
   - Verify personalization is correct
   - Test any links in the email

3. **Check Logs**:
   - Browser console for JavaScript errors
   - Google Apps Script logs for server errors
   - Email service logs for delivery status

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email address was entered correctly
- Check email service logs for errors
- Test with different email providers

### Personalization Not Working
- Verify form field names match script variables
- Check data validation in form handler
- Test with simple values first

### Gmail Sending Limits
- Gmail has daily sending limits
- Consider upgrading to G Suite for higher limits
- Use dedicated email service for high volume

## Next Steps

1. Choose your preferred email option
2. Follow the specific setup instructions
3. Test thoroughly with real email addresses
4. Monitor delivery rates and engagement
5. Optimize email content based on results

## Support Resources

- **Google Apps Script**: Google's official documentation
- **GoHighLevel**: Platform support and API docs
- **Email Services**: Each service's help documentation
- **General Issues**: Check browser console and server logs
