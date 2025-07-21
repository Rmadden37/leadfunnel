/**
 * Google Apps Script for Solar Form Handler
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create new project
 * 3. Replace default code with this code
 * 4. Update the SPREADSHEET_ID and YOUR_EMAIL constants below
 * 5. Save and deploy as web app
 * 6. Set execution as "Me" and access to "Anyone"
 * 7. Copy the web app URL to your form-handler.js file
 */

// Configuration - UPDATED WITH YOUR VALUES
const SPREADSHEET_ID = '12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI'; // Your Google Sheets ID
const YOUR_EMAIL = 'ryanmadden.fl@gmail.com'; // Your notification email address

// GoHighLevel Configuration - OPTIONAL: For email automation backup
const GHL_CONFIG = {
  webhookUrl: 'YOUR_GHL_WEBHOOK_URL', // Optional: GoHighLevel webhook URL
  apiKey: 'YOUR_GHL_API_KEY', // Optional: GoHighLevel API key
  emailTemplateId: '687d9c3fd9b8671d26069758' // Email template ID from URL
};

/**
 * Handle POST requests from the solar form
 */
function doPost(e) {
  try {
    // Debug logging
    console.log('doPost called with:', e);
    console.log('POST data:', e.postData);
    console.log('Contents:', e.postData.contents);
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data:', data);
    
    // Check if this is a special test request for sheets only
    if (data.action === 'testSheetsOnly') {
      console.log('Handling sheets-only test request');
      const testResult = testSheetsOnly();
      return ContentService
        .createTextOutput(testResult)
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Validate required data for normal form submissions
    if (!data.address || data.address.length < 10) {
      throw new Error('Invalid address provided: ' + (data.address || 'missing'));
    }
    
    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();
    console.log('Sheet accessed successfully');
    
    // Add the data to the sheet
    addLeadToSheet(sheet, data);
    console.log('Lead added to sheet');
    
    // Send notification email
    sendNotification(data);
    console.log('Notification email sent');
    
    // Send automated email to user (GoHighLevel integration)
    sendAutomatedEmailToUser(data);
    console.log('Automated email sent');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({status: 'success', message: 'Lead captured successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    // Still try to log the error
    try {
      logError(error, e);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get or create the spreadsheet and sheet
 */
function getOrCreateSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('Solar Leads');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Solar Leads');
      
      // Add headers
      const headers = [
        'Timestamp', 'Name', 'Street Address', 'City', 'ZIP Code', 'Full Address', 
        'Phone', 'Email', 'Source', 'Page URL', 'Referrer', 'User Agent', 'Status', 'Follow Up Date'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      
      // Set column widths
      sheet.setColumnWidth(1, 150); // Timestamp
      sheet.setColumnWidth(2, 250); // Address
      sheet.setColumnWidth(3, 120); // Phone
      sheet.setColumnWidth(4, 150); // Source
      sheet.setColumnWidth(5, 200); // Page URL
      sheet.setColumnWidth(6, 120); // Referrer
      sheet.setColumnWidth(7, 180); // User Agent
      sheet.setColumnWidth(8, 100); // Status
      sheet.setColumnWidth(9, 120); // Follow Up Date
    }
    
    return sheet;
    
  } catch (error) {
    throw new Error('Could not access spreadsheet. Check SPREADSHEET_ID: ' + error.toString());
  }
}

/**
 * Add lead data to the sheet
 */
function addLeadToSheet(sheet, data) {
  try {
    console.log('addLeadToSheet called with data:', data);
    
    const now = new Date();
    const followUpDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    // Combine address fields for full address
    const fullAddress = [
      data.address || '',
      data.city || '',
      data.zip || ''
    ].filter(field => field.trim().length > 0).join(', ');
    
    console.log('Full address created:', fullAddress);
    
    const row = [
      now.toLocaleString(), // Timestamp
      data.name || 'Not provided',
      data.address || '',
      data.city || '',
      data.zip || '',
      fullAddress,
      data.phone || 'Not provided',
      data.email || 'Not provided',
      data.source || 'Unknown',
      data.page_url || '',
      data.referrer || 'Direct',
      data.user_agent || '',
      'New Lead',
      followUpDate.toLocaleDateString()
    ];
    
    console.log('Row data prepared:', row);
    console.log('Row length:', row.length);
    
    // Get current row count before adding
    const beforeRowCount = sheet.getLastRow();
    console.log('Rows before adding:', beforeRowCount);
    
    // Add the row
    sheet.appendRow(row);
    console.log('appendRow() called successfully');
    
    // Get row count after adding
    const afterRowCount = sheet.getLastRow();
    console.log('Rows after adding:', afterRowCount);
    
    if (afterRowCount > beforeRowCount) {
      console.log('Row successfully added to sheet!');
      
      // Color code new leads
      const lastRow = sheet.getLastRow();
      const range = sheet.getRange(lastRow, 1, 1, row.length);
      range.setBackground('#e8f5e8'); // Light green for new leads
      console.log('Row formatting applied');
    } else {
      console.log('WARNING: Row count did not increase after appendRow()');
    }
    
  } catch (error) {
    console.error('Error in addLeadToSheet:', error);
    throw error;
  }
}

/**
 * Send email notification for new lead
 */
function sendNotification(data) {
  const fullAddress = [
    data.address || '',
    data.city || '',
    data.zip || ''
  ].filter(field => field.trim().length > 0).join(', ');
  
  const leadName = data.name || 'Unknown';
  const emailSubject = `🚨 NEW SOLAR LEAD - ${leadName} (${fullAddress || 'Unknown Address'})`;
  
  const emailBody = `
🏠 NEW SOLAR LEAD RECEIVED!

👤 Name: ${data.name || 'Not provided'}
📍 Street Address: ${data.address || 'Not provided'}
🏘️ City: ${data.city || 'Not provided'}
📮 ZIP Code: ${data.zip || 'Not provided'}
📍 Full Address: ${fullAddress}
📞 Phone: ${data.phone || 'Not provided - CALL IMMEDIATELY'}
📧 Email: ${data.email || 'Not provided'}
⏰ Time: ${data.timestamp}
🔗 Source: ${data.source}

📊 Page Details:
• URL: ${data.page_url}
• Referrer: ${data.referrer}
• User Agent: ${data.user_agent}

🎯 ACTION REQUIRED:
${data.phone ? 
  `Call ${data.phone} immediately while they're hot!` : 
  'No phone provided - follow up via address lookup or wait for callback'
}

---
Solar Lead Capture System
Generated: ${new Date().toLocaleString()}
  `;
  
  try {
    MailApp.sendEmail({
      to: YOUR_EMAIL,
      subject: emailSubject,
      body: emailBody
    });
    
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

/**
 * Send automated email to the user using GoHighLevel or Gmail
 * This is called for every form submission to send the welcome email
 */
function sendAutomatedEmailToUser(data) {
  try {
    if (GHL_CONFIG.webhookUrl && GHL_CONFIG.webhookUrl !== 'YOUR_GHL_WEBHOOK_URL') {
      // Try GoHighLevel first
      sendViaGoHighLevel(data);
    } else {
      // Fallback to Gmail
      sendWelcomeEmailViaGmail(data);
    }
    
    console.log('Automated welcome email sent to:', data.email);
    
  } catch (error) {
    console.error('Failed to send automated email:', error);
    // Try Gmail fallback if GoHighLevel fails
    try {
      sendWelcomeEmailViaGmail(data);
    } catch (fallbackError) {
      console.error('Gmail fallback also failed:', fallbackError);
    }
  }
}

/**
 * Send email via GoHighLevel webhook
 */
function sendViaGoHighLevel(data) {
  const payload = {
    email: data.email,
    firstName: data.name,
    phone: data.phone,
    address: `${data.address}, ${data.city}, ${data.zip}`,
    templateId: GHL_CONFIG.emailTemplateId,
    source: data.source || 'Solar Landing Page',
    customFields: {
      address: data.address,
      city: data.city,
      zip: data.zip,
      phone: data.phone,
      timestamp: data.timestamp
    }
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GHL_CONFIG.apiKey}`
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(GHL_CONFIG.webhookUrl, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`GoHighLevel API responded with ${response.getResponseCode()}: ${response.getContentText()}`);
  }
}

/**
 * Fallback: Send welcome email via Gmail
 */
function sendWelcomeEmailViaGmail(data) {
  const subject = 'Your Florida Solar Analysis - Next Steps';
  const body = `
Dear ${data.name},

Thank you for your interest in solar energy for your home at ${data.address}, ${data.city}, ${data.zip}.

🌟 GREAT NEWS: You've submitted your information just in time to take advantage of the federal solar incentives before they expire on December 31st!

📞 WHAT HAPPENS NEXT:
Ryan Madden will be calling you shortly at ${data.phone} to discuss:
• Your home's specific solar potential
• Current electricity costs and potential savings
• Available federal and local incentives
• $0-down installation options
• 25-year warranty coverage

⚡ QUICK FACTS ABOUT YOUR AREA:
• Florida homeowners save an average of $60,000+ over 20 years
• Federal tax credit covers 30% of system cost
• No upfront costs with approved financing
• Systems pay for themselves in 6-8 years on average

🏆 WHY CHOOSE US:
• 9+ years of experience in Florida
• NABCEP Certified Installation
• Over 2,000 successful installations
• Featured on Fox 13, ABC Action News, and Tampa Bay Times
• Complete 25-year bumper-to-bumper warranty

If you have any immediate questions, feel free to call or text Ryan directly at (561) 301-7564.

Thanks again for taking the first step toward energy independence!

Best regards,
Ryan Madden
Florida Solar Specialist
(561) 301-7564

P.S. Remember, federal incentives are scheduled to change after 2025. Act now to lock in today's savings!

---
This email was sent because you requested a solar analysis on our website.
Freedom Forever Authorized Dealer | Not affiliated with TECO | Subject to credit and roof approval.
  `;

  try {
    MailApp.sendEmail(data.email, subject, body);
    console.log('Welcome email sent via Gmail to:', data.email);
  } catch (error) {
    console.error('Gmail email failed:', error);
    throw error;
  }
}

/**
 * Log errors to a separate sheet for debugging
 */
function logError(error, request) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let errorSheet = spreadsheet.getSheetByName('Errors');
    
    if (!errorSheet) {
      errorSheet = spreadsheet.insertSheet('Errors');
      const headers = ['Timestamp', 'Error Message', 'Stack Trace', 'Request Data'];
      errorSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    const errorRow = [
      new Date().toLocaleString(),
      error.toString(),
      error.stack || 'No stack trace',
      request ? JSON.stringify(request.postData) : 'No request data'
    ];
    
    errorSheet.appendRow(errorRow);
  } catch (logError) {
    console.error('Failed to log error to sheet:', logError);
  }
}

/**
 * Test function to verify Google Sheets connectivity
 */
function testSheetsOnly() {
  console.log('=== TESTING GOOGLE SHEETS CONNECTIVITY ===');
  
  try {
    // Test 1: Access spreadsheet
    console.log('Test 1: Accessing spreadsheet...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✓ Spreadsheet accessed successfully');
    console.log('Spreadsheet name:', spreadsheet.getName());
    
    // Test 2: Get or create sheet
    console.log('Test 2: Getting/creating sheet...');
    let sheet = spreadsheet.getSheetByName('Solar Leads');
    if (!sheet) {
      console.log('Creating new sheet...');
      sheet = spreadsheet.insertSheet('Solar Leads');
      console.log('✓ New sheet created');
    } else {
      console.log('✓ Existing sheet found');
    }
    
    // Test 3: Check current data
    const currentRows = sheet.getLastRow();
    console.log('Current row count:', currentRows);
    
    // Test 4: Try to write a simple test row
    console.log('Test 4: Writing test row...');
    const testRow = ['TEST', 'Manual Test', new Date().toLocaleString()];
    sheet.appendRow(testRow);
    
    const newRowCount = sheet.getLastRow();
    console.log('Row count after test:', newRowCount);
    
    if (newRowCount > currentRows) {
      console.log('✓ SUCCESS: Test row added successfully!');
      return 'Google Sheets connectivity is working!';
    } else {
      console.log('✗ PROBLEM: Row count did not increase');
      return 'Google Sheets write operation may have failed';
    }
    
  } catch (error) {
    console.error('✗ Google Sheets test failed:', error);
    return 'Error: ' + error.toString();
  }
}

/**
 * Test function to verify setup
 */
function testSetup() {
  const testData = {
    name: 'Test User',
    address: '123 Test Street',
    city: 'Tampa',
    zip: '33601',
    phone: '(561) 301-7564',
    email: 'test@example.com',
    source: 'Test Setup',
    timestamp: new Date().toLocaleString(),
    page_url: 'https://test-solar-site.com',
    referrer: 'Direct',
    user_agent: 'Test Browser/1.0'
  };
  
  try {
    console.log('Testing spreadsheet access...');
    const sheet = getOrCreateSheet();
    console.log('✓ Spreadsheet access successful');
    
    console.log('Testing lead addition...');
    addLeadToSheet(sheet, testData);
    console.log('✓ Lead added successfully');
    
    console.log('Testing email notification...');
    sendNotification(testData);
    console.log('✓ Email notification sent');
    
    console.log('Testing automated welcome email...');
    sendAutomatedEmailToUser(testData);
    console.log('✓ Automated email sent');
    
    console.log('🎉 Setup test completed successfully!');
    console.log('Your Google Apps Script is ready to receive leads.');
    
    return 'All tests passed!';
    
  } catch (error) {
    console.error('❌ Setup test failed:', error);
    console.log('Please check your SPREADSHEET_ID and YOUR_EMAIL constants');
    throw error;
  }
}

/**
 * Simple test function that mimics a form submission
 */
function testFormSubmission() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: 'John Test',
        address: '456 Test Avenue',
        city: 'Tampa',
        zip: '33602', 
        phone: '(813) 555-1234',
        email: 'john.test@example.com',
        source: 'Landing Page Test',
        timestamp: new Date().toLocaleString(),
        page_url: 'https://your-solar-site.com',
        referrer: 'Direct',
        user_agent: 'Test Browser'
      })
    }
  };
  
  console.log('Testing complete form submission flow...');
  return doPost(mockEvent);
}

/**
 * Initialize spreadsheet with sample data and formatting
 */
function initializeSpreadsheet() {
  try {
    const sheet = getOrCreateSheet();
    
    // Add sample data if sheet is empty (except headers)
    if (sheet.getLastRow() === 1) {
      const sampleData = [
        [
          new Date().toLocaleString(),           // Timestamp (matches addLeadToSheet format)
          'John Doe',                           // Name
          '123 Sample Street',                  // Street Address
          'Tampa',                             // City
          '33601',                            // ZIP Code
          '123 Sample Street, Tampa, 33601',  // Full Address
          '(555) 123-4567',                  // Phone
          'john@example.com',                // Email
          'Sample Lead',                     // Source
          'https://your-solar-site.com',    // Page URL
          'Google',                         // Referrer
          'Mozilla/5.0 (Sample Browser)',  // User Agent
          'Sample',                        // Status
          new Date(Date.now() + 86400000).toLocaleDateString() // Follow Up Date (matches addLeadToSheet format)
        ]
      ];
      
      sheet.getRange(2, 1, 1, sampleData[0].length).setValues(sampleData);
      sheet.getRange(2, 1, 1, sampleData[0].length).setBackground('#f0f0f0');
    }
    
    console.log('Spreadsheet initialized successfully!');
    
  } catch (error) {
    console.error('Failed to initialize spreadsheet:', error);
  }
}
