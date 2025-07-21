# 🚀 Ryan's Solar Email Automation - Quick Deploy Checklist

## ✅ **Pre-configured Settings:**
- **Google Sheets ID**: `12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI` ✅
- **Professional Email Template**: Freedom Forever branded ✅
- **Form Integration**: Ready for Google Apps Script ✅

## 📋 **5-Minute Setup Steps:**

### **Step 1: Google Apps Script** (2 minutes)
1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. **Copy & paste** all code from `google-apps-script.js`
4. **Update line 15**: Change `YOUR_EMAIL` to your notification email
5. **Save** (Ctrl/Cmd + S)

### **Step 2: Google Sheets** (1 minute)
1. Go to [sheets.google.com](https://sheets.google.com)
2. **Create new spreadsheet**
3. **Name it**: "Solar Leads"
4. **Verify the URL contains**: `12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI`

### **Step 3: Deploy Web App** (1 minute)
1. In Google Apps Script: **Deploy** → **New deployment**
2. **Type**: Web app
3. **Execute as**: Me
4. **Access**: Anyone
5. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

### **Step 4: Update Form Handler** (1 minute)
1. **Open** `form-handler.js`
2. **Replace line 7**: Paste your Web App URL
   ```javascript
   this.googleAppsScriptUrl = 'YOUR_WEB_APP_URL_HERE';
   ```

## 🎯 **What You'll Get:**

### **📧 Automated Emails:**
- **User Welcome**: Professional Freedom Forever branded email
- **Admin Notifications**: Instant alerts for each lead
- **Gmail Backup**: Automatic fallback if anything fails

### **📊 Lead Management:**
- **Google Sheets**: All leads automatically saved
- **Complete Data**: Name, address, phone, email, timestamp
- **Lead Tracking**: Source, referrer, and user agent info

### **🛡️ Professional Features:**
- **"Do Not Reply" Setup**: Clean, professional appearance
- **Error Logging**: All issues tracked for debugging
- **Mobile Responsive**: Beautiful emails on all devices

## 🧪 **Testing (30 seconds):**
1. **Open** `index.html` in browser
2. **Fill out form** with test data
3. **Check Google Sheets** for new row
4. **Check email** for notifications

## 📞 **Contact Setup:**
The emails will show:
- **From**: "Ryan Madden - Freedom Forever"
- **Contact**: (561) 301-7564
- **Reply-To**: Your configured email address

---

## 🔥 **You're Ready to Capture Leads!**

Once deployed, every form submission will:
1. ✅ **Save to Google Sheets** automatically
2. ✅ **Email you instantly** with lead details  
3. ✅ **Send professional welcome** to the user
4. ✅ **Track everything** for follow-up

**Total setup time: ~5 minutes**  
**Monthly cost: $0** (uses free Google services)  
**Professional results: Priceless** 🎉
