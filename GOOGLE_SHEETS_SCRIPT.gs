/*
 * Google Apps Script - Data API for TikTok Dashboard
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Rename the first sheet (tab) to "Data".
 * 3. Add the following headers in the first row (A1:R1):
 *    id | name | thumbnail | du | avgW | re | vw | lk | bm | cm | sh | pfm | products | cpm | cpe | mainProduct | status | date
 * 
 * 4. Go to Extensions > Apps Script.
 * 5. Paste this entire code into Code.gs (delete any existing code).
 * 6. Click 'Deploy' > 'New deployment'.
 * 7. Select type: 'Web app'.
 * 8. Description: 'API v1'.
 * 9. Execute as: 'Me'.
 * 10. Who has access: 'Anyone'. (IMPORTANT!)
 * 11. Click 'Deploy', authorize access, and COPY the Web App URL.
 */

// Configuration
var SHEET_NAME = "Data";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Check for "action" parameter or default to read/write based on method
    var action = e.parameter.action;
    
    if (e.postData) {
      // It's a write operation
      var data = JSON.parse(e.postData.contents);
      
      if (data.action === 'delete') {
        // DELETE operation
        return deleteRow(sheet, data.id);
      } else {
        // CREATE operation
        return createRow(sheet, data);
      }
    } else {
      // It's a read operation
      return readRows(sheet);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function readRows(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1); // Skip header
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function createRow(sheet, data) {
  // Ensure data order matches headers
  // Headers: id | name | thumbnail | du | avgW | re | vw | lk | bm | cm | sh | pfm | products | cpm | cpe | mainProduct | status | date
  
  var newRow = [
    data.id,
    data.name,
    data.thumbnail,
    data.du,
    data.avgW,
    data.re,
    data.vw,
    data.lk,
    data.bm,
    data.cm,
    data.sh,
    data.pfm,
    data.products,
    data.cpm,
    data.cpe,
    data.mainProduct,
    data.status,
    data.date
  ];
  
  sheet.appendRow(newRow);
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "id": data.id }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteRow(sheet, idToDelete) {
  var data = sheet.getDataRange().getValues();
  // Assume ID is in column 0 (A)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == idToDelete) {
      sheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "deleted", "id": idToDelete }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "ID not found" }))
    .setMimeType(ContentService.MimeType.JSON);
}
