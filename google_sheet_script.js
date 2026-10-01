/**
 * =========================================================================
 *  THE VEG STUDIO - GOOGLE SHEETS ORDER MANAGEMENT & EMAIL NOTIFICATIONS
 * =========================================================================
 * 
 * FEATURES:
 * 1. Automatically logs orders into 16 clean, structured columns.
 * 2. Sends a beautiful, professional HTML Invoice to the CUSTOMER.
 * 3. Sends an instant New Order Alert to the CAFE ADMIN.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with THIS entire script.
 * 4. Verify/Update the ADMIN_EMAIL below if needed.
 * 5. Click the Save icon (Ctrl+S or Cmd+S).
 * 6. Click "Deploy" > "Manage deployments" > Edit Pencil ✏️ > Version: "New version" > "Deploy".
 */

// =========================================================================
// CONFIGURATION
// =========================================================================
var CAFE_NAME = "The Veg Studio";
var CAFE_PHONE = "+91 9082287761";
var CAFE_EMAIL = "thevegstudio30@gmail.com";
var ADMIN_EMAIL = "thevegstudio30@gmail.com"; // Admin gets alerts here!

// Custom Top Menu in Google Sheets
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🌿 The Veg Studio")
    .addItem("✨ Format & Fix All Columns", "setupSheetAndFormat")
    .addItem("🔓 Unfreeze Top Rows", "unfreezeRows")
    .addItem("🧹 Reset Headers", "setupSheetHeaders")
    .addItem("📧 Send Test Email", "sendTestEmail")
    .addToUi();
}

function unfreezeRows() {
  var sheet = getActiveSheet();
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
}

function getActiveSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

// 16 Exact Columns Layout
var HEADERS = [
  "Order ID",              // Col 1
  "Order Date & Time",     // Col 2
  "Customer Name",         // Col 3
  "Phone Number",          // Col 4
  "Email",                 // Col 5
  "Delivery Type",         // Col 6
  "Delivery Address",      // Col 7
  "Payment Method",        // Col 8
  "Items Summary",         // Col 9
  "Subtotal (₹)",          // Col 10
  "Delivery Fee (₹)",      // Col 11
  "GST (₹)",               // Col 12
  "Discount (₹)",          // Col 13
  "Total Paid (₹)",        // Col 14
  "Special Instructions",  // Col 15
  "Order Status"           // Col 16
];

function setupSheetHeaders() {
  var sheet = getActiveSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  setupSheetAndFormat();
}

// Format and fix design, alignment, widths & status dropdown
function setupSheetAndFormat() {
  var sheet = getActiveSheet();
  var numCols = HEADERS.length;
  var lastRow = Math.max(sheet.getLastRow(), 1);

  sheet.getRange(1, 1, 1, numCols).setValues([HEADERS]);

  // Header Row Design
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#214E29");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(0); // Unfrozen

  // 16 Column Widths
  var colWidths = [
    110, // 1. Order ID
    140, // 2. Date & Time
    150, // 3. Customer Name
    125, // 4. Phone
    160, // 5. Email
    120, // 6. Delivery Type
    260, // 7. Delivery Address
    140, // 8. Payment Method
    280, // 9. Items Summary
    95,  // 10. Subtotal
    95,  // 11. Delivery Fee
    80,  // 12. GST
    80,  // 13. Discount
    110, // 14. Total Paid
    180, // 15. Special Instructions
    130  // 16. Order Status
  ];

  for (var i = 0; i < colWidths.length; i++) {
    sheet.setColumnWidth(i + 1, colWidths[i]);
  }

  // Format existing data rows
  if (lastRow >= 2) {
    var numDataRows = lastRow - 1;
    var dataRange = sheet.getRange(2, 1, numDataRows, numCols);
    dataRange.setFontFamily("Arial");
    dataRange.setFontSize(9.5);
    dataRange.setVerticalAlignment("top");
    dataRange.setWrap(true);
    dataRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(2, 1, numDataRows, 1).setHorizontalAlignment("center").setFontWeight("bold");
    sheet.getRange(2, 2, numDataRows, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, numDataRows, 1).setHorizontalAlignment("left").setFontWeight("bold");
    sheet.getRange(2, 4, numDataRows, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, numDataRows, 1).setHorizontalAlignment("left");
    sheet.getRange(2, 6, numDataRows, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 7, numDataRows, 1).setHorizontalAlignment("left");
    sheet.getRange(2, 8, numDataRows, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 9, numDataRows, 1).setHorizontalAlignment("left");

    var numRange = sheet.getRange(2, 10, numDataRows, 5);
    numRange.setHorizontalAlignment("right").setNumberFormat('"₹"#,##0');

    sheet.getRange(2, 14, numDataRows, 1).setFontWeight("bold").setFontColor("#1E4D2B");
    sheet.getRange(2, 15, numDataRows, 1).setHorizontalAlignment("left");

    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["🟡 New Order", "👨‍🍳 In Kitchen", "🛵 Out for Delivery", "✅ Delivered", "❌ Cancelled"], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, 16, numDataRows, 1).setDataValidation(statusRule).setHorizontalAlignment("center").setFontWeight("bold");
  }
}

// Receive order and trigger notifications
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var sheet = getActiveSheet();

    // Parse data
    var raw = (e && e.postData) ? e.postData.contents : "";
    var data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      setupSheetAndFormat();
    }

    // Append Order Row
    var orderRow = [
      data.orderId || "",                                  // 1. Order ID
      data.orderDate || new Date().toLocaleString("en-IN"),// 2. Date & Time
      data.customerName || "",                             // 3. Customer Name
      data.phone ? "'" + data.phone : "",                  // 4. Phone Number
      data.email || "",                                    // 5. Email
      data.deliveryType || "Home Delivery",                // 6. Delivery Type
      data.address || "",                                  // 7. Delivery Address
      data.paymentMethod || "Cash on Delivery",            // 8. Payment Method
      data.items || "",                                    // 9. Items Summary
      Number(data.subtotal) || 0,                          // 10. Subtotal (₹)
      Number(data.deliveryFee) || 0,                       // 11. Delivery Fee (₹)
      Number(data.tax) || 0,                               // 12. GST (₹)
      Number(data.discount) || 0,                          // 13. Discount (₹)
      Number(data.totalPaid) || 0,                         // 14. Total Paid (₹)
      data.specialInstructions || "",                      // 15. Special Instructions
      "🟡 New Order"                                       // 16. Order Status
    ];

    sheet.appendRow(orderRow);

    // Format new row
    var rowIdx = sheet.getLastRow();
    var rowRange = sheet.getRange(rowIdx, 1, 1, 16);
    rowRange.setFontFamily("Arial");
    rowRange.setFontSize(9.5);
    rowRange.setVerticalAlignment("top");
    rowRange.setWrap(true);
    rowRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(rowIdx, 1).setHorizontalAlignment("center").setFontWeight("bold");
    sheet.getRange(rowIdx, 2).setHorizontalAlignment("center");
    sheet.getRange(rowIdx, 3).setHorizontalAlignment("left").setFontWeight("bold");
    sheet.getRange(rowIdx, 4).setHorizontalAlignment("center");
    sheet.getRange(rowIdx, 5).setHorizontalAlignment("left");
    sheet.getRange(rowIdx, 6).setHorizontalAlignment("center");
    sheet.getRange(rowIdx, 7).setHorizontalAlignment("left");
    sheet.getRange(rowIdx, 8).setHorizontalAlignment("center");
    sheet.getRange(rowIdx, 9).setHorizontalAlignment("left");

    sheet.getRange(rowIdx, 10, 1, 5).setHorizontalAlignment("right").setNumberFormat('"₹"#,##0');
    sheet.getRange(rowIdx, 14).setFontWeight("bold").setFontColor("#1E4D2B");
    sheet.getRange(rowIdx, 15).setHorizontalAlignment("left");

    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["🟡 New Order", "👨‍🍳 In Kitchen", "🛵 Out for Delivery", "✅ Delivered", "❌ Cancelled"], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(rowIdx, 16).setDataValidation(statusRule).setHorizontalAlignment("center").setFontWeight("bold");

    // =========================================================================
    // SEND EMAILS (Customer Invoice + Admin Notification)
    // =========================================================================
    try {
      sendCustomerInvoiceEmail(data);
    } catch (custErr) {
      Logger.log("Customer email error: " + custErr.toString());
    }

    try {
      sendAdminNotificationEmail(data);
    } catch (admErr) {
      Logger.log("Admin email error: " + admErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order recorded and email notifications sent",
      orderId: data.orderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// 1. CUSTOMER INVOICE EMAIL
// =========================================================================
function sendCustomerInvoiceEmail(data) {
  var custEmail = (data.email || "").trim();
  if (!custEmail || custEmail.indexOf("@") === -1 || custEmail === "N/A") {
    return; // No valid customer email provided
  }

  var orderId = data.orderId || "TVS-Order";
  var custName = data.customerName || "Valued Customer";
  var itemsHtml = buildItemsTableHtml(data);

  var subject = "🌿 Order Confirmed " + orderId + " - The Veg Studio";

  var htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #F8F5EE; margin: 0; padding: 20px; color: #2A1F17; }
      .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #EFEAE0; }
      .header { background: #214E29; color: #FFFFFF; padding: 25px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-family: Georgia, serif; letter-spacing: 0.5px; }
      .header p { margin: 6px 0 0; font-size: 13px; color: #E8D39A; }
      .content { padding: 25px 25px 20px; }
      .badge-box { background: #F0F6EE; border: 1px solid #D4E8CE; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
      .badge-title { font-size: 11px; text-transform: uppercase; color: #4A6E40; font-weight: bold; }
      .badge-val { font-size: 15px; font-weight: bold; color: #214E29; }
      table.items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13.5px; }
      table.items-table th { background: #FAF7F0; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7B6858; border-bottom: 2px solid #EAE2D5; }
      table.items-table td { padding: 12px 8px; border-bottom: 1px solid #F0EAE1; vertical-align: top; }
      .total-section { margin-top: 15px; border-top: 2px solid #214E29; padding-top: 10px; }
      .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13.5px; }
      .grand-total { font-size: 18px; font-weight: bold; color: #214E29; border-top: 1px dashed #DDD; padding-top: 8px; margin-top: 6px; }
      .info-box { background: #FAF8F2; border-left: 4px solid #214E29; padding: 12px 15px; margin: 20px 0 15px; border-radius: 0 8px 8px 0; font-size: 13px; }
      .footer { background: #FAF8F5; border-top: 1px solid #EFEAE0; padding: 18px 20px; text-align: center; font-size: 12px; color: #8A7A6D; }
      .footer a { color: #214E29; font-weight: bold; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🌿 The Veg Studio</h1>
        <p>Fresh Ingredients • Pure Veg • Premium Taste</p>
      </div>

      <div class="content">
        <h2 style="font-size: 19px; color: #214E29; margin-top: 0;">Order Receipt & Confirmation</h2>
        <p style="font-size: 14px; line-height: 1.5;">Hi <strong>${custName}</strong>, thank you for your order! Your delicious vegetarian meal is being prepared fresh by our chefs.</p>

        <div style="background: #F4F7F2; border: 1px solid #D8E5D3; border-radius: 8px; padding: 12px 15px; margin: 15px 0;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td><strong>Order ID:</strong> <span style="color: #214E29; font-weight: bold;">${orderId}</span></td>
              <td style="text-align: right;"><strong>Date:</strong> ${data.orderDate || new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Payment:</strong> ${data.paymentMethod || "Cash on Delivery"}</td>
              <td style="text-align: right;"><strong>Delivery:</strong> 🛵 30-45 Mins</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; color: #7B6858; margin-bottom: 8px; letter-spacing: 0.5px;">Ordered Items</h3>
        ${itemsHtml}

        <div class="total-section">
          <table style="width: 100%; font-size: 13.5px;">
            <tr><td>Subtotal:</td><td style="text-align: right;">₹${data.subtotal || 0}</td></tr>
            <tr><td>Delivery Fee:</td><td style="text-align: right;">₹${data.deliveryFee || 0}</td></tr>
            <tr><td>GST (5%):</td><td style="text-align: right;">₹${data.tax || 0}</td></tr>
            ${data.discount > 0 ? `<tr><td style="color:#C0392B;">Discount:</td><td style="text-align: right; color:#C0392B;">-₹${data.discount}</td></tr>` : ""}
            <tr style="font-size: 17px; font-weight: bold; color: #214E29;">
              <td style="padding-top: 8px; border-top: 1px solid #DDD;">Total Amount:</td>
              <td style="text-align: right; padding-top: 8px; border-top: 1px solid #DDD;">₹${data.totalPaid || 0}</td>
            </tr>
          </table>
        </div>

        <div class="info-box">
          <strong>🛵 Delivery Address:</strong><br/>
          ${data.address || "Address not specified"}<br/><br/>
          <strong>📞 Customer Contact:</strong> ${data.phone || ""}<br/>
          ${data.specialInstructions && data.specialInstructions !== "None" ? `<strong>📝 Cooking Instructions:</strong> ${data.specialInstructions}` : ""}
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px;">Questions about your order? Call us at <a href="tel:${CAFE_PHONE}">${CAFE_PHONE}</a></p>
        <p style="margin: 0;">📍 The Veg Studio, Mira Rd, Maharashtra • Pure Veg Café</p>
      </div>
    </div>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: custEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: CAFE_NAME
  });
}

// =========================================================================
// 2. CAFE ADMIN ALERT EMAIL
// =========================================================================
function sendAdminNotificationEmail(data) {
  var adminTo = (ADMIN_EMAIL || "").trim();
  if (!adminTo) return;

  var orderId = data.orderId || "TVS-Order";
  var custName = data.customerName || "Customer";
  var total = data.totalPaid || 0;
  var itemsHtml = buildItemsTableHtml(data);
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var subject = "🔔 NEW ORDER: " + orderId + " - ₹" + total + " (" + custName + ")";

  var htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; background: #ECEFF1; margin: 0; padding: 20px; color: #263238; }
      .card { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; border: 2px solid #214E29; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .header { background: #214E29; color: #FFF; padding: 18px 20px; text-align: center; }
      .header h2 { margin: 0; font-size: 22px; }
      .content { padding: 20px; }
      .highlight { background: #FFF9C4; border: 1px solid #FBC02D; padding: 10px 14px; border-radius: 6px; margin-bottom: 15px; font-weight: bold; font-size: 14px; color: #795548; }
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13.5px; }
      .info-table td { padding: 6px 4px; border-bottom: 1px solid #ECEFF1; }
      .btn { display: inline-block; background: #214E29; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h2>🔔 New Online Order Received!</h2>
      </div>
      <div class="content">
        <div class="highlight">
          ⚡ Order ID: ${orderId} | Total: ₹${total} | ${data.paymentMethod || "Cash on Delivery"}
        </div>

        <table class="info-table">
          <tr><td style="width: 35%;"><strong>Customer Name:</strong></td><td><strong>${custName}</strong></td></tr>
          <tr><td><strong>Phone Number:</strong></td><td><a href="tel:${data.phone}" style="font-size: 15px; font-weight: bold; color: #214E29;">${data.phone}</a></td></tr>
          <tr><td><strong>Email:</strong></td><td>${data.email || "N/A"}</td></tr>
          <tr><td><strong>Delivery Address:</strong></td><td style="color: #D32F2F; font-weight: bold;">${data.address || "N/A"}</td></tr>
          <tr><td><strong>Order Time:</strong></td><td>${data.orderDate || new Date().toLocaleString()}</td></tr>
          ${data.specialInstructions && data.specialInstructions !== "None" ? `<tr><td><strong>Special Notes:</strong></td><td style="background: #FFF3E0; color: #E65100; font-weight: bold;">${data.specialInstructions}</td></tr>` : ""}
        </table>

        <h3 style="margin: 15px 0 8px; font-size: 15px; color: #214E29;">Order Breakdown:</h3>
        ${itemsHtml}

        <div style="text-align: center; margin-top: 20px;">
          <a href="${sheetUrl}" class="btn" target="_blank">📊 Open Live Google Sheet</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: adminTo,
    subject: subject,
    htmlBody: htmlBody,
    name: "The Veg Studio Bot"
  });
}

// Helper: Build structured HTML table for dishes
function buildItemsTableHtml(data) {
  if (data.itemsDetail && Array.isArray(data.itemsDetail) && data.itemsDetail.length > 0) {
    var rows = data.itemsDetail.map(function(item) {
      var customText = item.customization && item.customization !== "Standard" ? `<br/><span style="color:#2E7D32; font-size:11px;">[${item.customization}]</span>` : "";
      var extraText = item.extraPieces > 0 ? `<br/><span style="color:#E65100; font-size:11px;">(+${item.extraPieces} Extra Pcs)</span>` : "";
      var noteText = item.note ? `<br/><span style="color:#795548; font-size:11px; font-style:italic;">Note: ${item.note}</span>` : "";

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #EEE;">
            <strong>${item.name}</strong>${customText}${extraText}${noteText}
          </td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #EEE;">× ${item.plates}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; border-bottom: 1px solid #EEE;">₹${item.lineTotal}</td>
        </tr>
      `;
    }).join("");

    return `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px;">
        <thead>
          <tr style="background: #F5F5F5; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } else {
    // Fallback if plain text summary is passed
    return `<div style="background:#F9F9F9; padding:10px; border-radius:6px; font-size:13px; line-height:1.6; white-space:pre-line;">${data.items || "No items listed"}</div>`;
  }
}

// Test Function from Google Sheets Menu
function sendTestEmail() {
  var sampleData = {
    orderId: "#TVS-TEST01",
    orderDate: new Date().toLocaleString("en-IN"),
    customerName: "Test Customer",
    phone: "+91 9082287761",
    email: Session.getActiveUser().getEmail(),
    deliveryType: "Home Delivery",
    address: "Shop 4, Mira Rd, Mumbai - 401107",
    paymentMethod: "Cash on Delivery",
    subtotal: 240,
    deliveryFee: 40,
    tax: 12,
    discount: 0,
    totalPaid: 292,
    specialInstructions: "Extra green chutney please",
    itemsDetail: [
      { name: "Veg Studio Special Sub", customization: "Spicy", plates: 1, extraPieces: 0, lineTotal: 240, note: "" }
    ]
  };

  sendCustomerInvoiceEmail(sampleData);
  sendAdminNotificationEmail(sampleData);
  SpreadsheetApp.getUi().alert("✅ Test emails sent successfully to: " + Session.getActiveUser().getEmail());
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "The Veg Studio Order Sync & Email Webhook is live."
  })).setMimeType(ContentService.MimeType.JSON);
}
