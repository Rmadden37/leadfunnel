/**
 * Diagnostic function to check what's actually in the Google Sheet
 * Run this in Google Apps Script to see exactly what data exists
 */

// Use your same spreadsheet ID
const SPREADSHEET_ID = '12p1YEySSmVizpxcQBwrxHmZDaPv3W8qVbOp0oq_kQDI';

function diagnosticSheetContents() {
  try {
    console.log('=== GOOGLE SHEETS DIAGNOSTIC ===');
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Spreadsheet name:', spreadsheet.getName());
    
    // Get all sheets
    const allSheets = spreadsheet.getSheets();
    console.log('Total sheets in spreadsheet:', allSheets.length);
    
    allSheets.forEach((sheet, index) => {
      console.log(`Sheet ${index + 1}: "${sheet.getName()}" - ${sheet.getLastRow()} rows, ${sheet.getLastColumn()} columns`);
    });
    
    // Look specifically for Solar Leads sheet
    let solarSheet = spreadsheet.getSheetByName('Solar Leads');
    
    if (!solarSheet) {
      console.log('❌ No "Solar Leads" sheet found');
      console.log('Available sheets:');
      allSheets.forEach(sheet => {
        console.log('  -', sheet.getName());
      });
      return 'No Solar Leads sheet found';
    }
    
    console.log('✅ Solar Leads sheet found');
    console.log('Solar Leads sheet details:');
    console.log('  - Last row:', solarSheet.getLastRow());
    console.log('  - Last column:', solarSheet.getLastColumn());
    
    // Get all data from the sheet
    if (solarSheet.getLastRow() > 0) {
      const allData = solarSheet.getRange(1, 1, solarSheet.getLastRow(), solarSheet.getLastColumn()).getValues();
      
      console.log('=== ACTUAL SHEET CONTENTS ===');
      allData.forEach((row, rowIndex) => {
        console.log(`Row ${rowIndex + 1}:`, row);
      });
    } else {
      console.log('Sheet is completely empty');
    }
    
    return 'Diagnostic complete - check execution log for details';
    
  } catch (error) {
    console.error('Diagnostic failed:', error);
    return 'Error: ' + error.toString();
  }
}

function fixSheetVisibility() {
  try {
    console.log('=== FIXING SHEET VISIBILITY ===');
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const solarSheet = spreadsheet.getSheetByName('Solar Leads');
    
    if (!solarSheet) {
      console.log('Creating Solar Leads sheet...');
      const newSheet = spreadsheet.insertSheet('Solar Leads');
      
      // Add headers
      const headers = [
        'Timestamp', 'Name', 'Street Address', 'City', 'ZIP Code', 'Full Address', 
        'Phone', 'Email', 'Source', 'Page URL', 'Referrer', 'User Agent', 'Status', 'Follow Up Date'
      ];
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = newSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      console.log('Solar Leads sheet created with headers');
      return 'Solar Leads sheet created successfully';
    }
    
    // Clear any filters
    solarSheet.getFilter()?.remove();
    console.log('Filters cleared');
    
    // Make sure sheet is visible and active
    solarSheet.activate();
    console.log('Solar Leads sheet activated');
    
    // Resize columns for better visibility
    const columnWidths = [150, 200, 250, 120, 100, 300, 150, 200, 150, 200, 120, 180, 100, 120];
    columnWidths.forEach((width, index) => {
      solarSheet.setColumnWidth(index + 1, width);
    });
    
    console.log('Sheet formatting applied');
    return 'Sheet visibility fixed successfully';
    
  } catch (error) {
    console.error('Fix failed:', error);
    return 'Error: ' + error.toString();
  }
}
