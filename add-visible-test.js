// Add this function to your Google Apps Script and run it
function addVisibleTestData() {
  try {
    console.log('Adding visible test data...');
    
    const spreadsheet = SpreadsheetApp.openById('12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI');
    let sheet = spreadsheet.getSheetByName('Solar Leads');
    
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet('Solar Leads');
      
      // Add headers with bright formatting
      const headers = [
        'Timestamp', 'Name', 'Street Address', 'City', 'ZIP Code', 'Full Address', 
        'Phone', 'Email', 'Source', 'Page URL', 'Referrer', 'User Agent', 'Status', 'Follow Up Date'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#FF0000'); // Bright red so you can't miss it
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(12);
    }
    
    // Add very obvious test data
    const testData = [
      [
        new Date().toLocaleString(),
        '🚨 VISIBLE TEST USER 🚨',
        '123 TEST STREET - YOU SHOULD SEE THIS',
        'TAMPA',
        '33601',
        '123 TEST STREET - YOU SHOULD SEE THIS, TAMPA, 33601',
        '(555) 123-TEST',
        'visible.test@example.com',
        '🔥 VISIBILITY TEST',
        'https://test-visibility.com',
        'Manual Test',
        'Visibility Test Browser',
        '✅ VISIBLE',
        new Date().toLocaleDateString()
      ],
      [
        new Date().toLocaleString(),
        '🎯 SECOND TEST ROW',
        '456 ANOTHER TEST STREET',
        'MIAMI',
        '33101',
        '456 ANOTHER TEST STREET, MIAMI, 33101',
        '(305) 555-TEST',
        'second.test@example.com',
        '🔍 SECOND TEST',
        'https://second-test.com',
        'Direct',
        'Second Test Browser',
        '✅ WORKING',
        new Date().toLocaleDateString()
      ]
    ];
    
    // Add the data with bright highlighting
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, testData.length, testData[0].length).setValues(testData);
    
    // Make it super visible
    const dataRange = sheet.getRange(startRow, 1, testData.length, testData[0].length);
    dataRange.setBackground('#FFFF00'); // Bright yellow
    dataRange.setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, testData[0].length);
    
    // Activate the sheet so it's visible
    sheet.activate();
    
    console.log('✅ Visible test data added successfully!');
    console.log('Check the "Solar Leads" tab in your Google Sheets');
    
    return 'SUCCESS: Bright yellow test data added to Solar Leads sheet!';
    
  } catch (error) {
    console.error('Failed to add visible test data:', error);
    return 'Error: ' + error.toString();
  }
}
