/**
 * END-TO-END PRINT SETTINGS VERIFICATION SCRIPT
 * 
 * This script verifies the FULL data flow:
 *   1. Creates a test order with specific print settings (B&W, pages 1-3, landscape)
 *   2. Reads the order back from the database to verify storage
 *   3. Shows exactly what pdf-to-printer would receive
 * 
 * Run: node test-flow.js
 */

const BACKEND_URL = 'http://127.0.0.1:4000';

// ── Test print settings ──────────────────────────────────────────────────────
const TEST_ORDER = {
  files: [
    {
      fileName: "test-document.pdf",
      cloudinaryUrl: "https://res.cloudinary.com/demo/raw/upload/test.pdf",
      pages: 3,           // 3 pages for pricing
      copies: 2,          // 2 copies
      colour: false,      // B&W ← THIS SHOULD BECOME monochrome: true
      duplex: true,       // Double-sided
      orientation: "landscape",  // ← NEW FIELD
      pageRange: "1-3",          // ← NEW FIELD (only print pages 1-3)
    }
  ],
  paymentMode: "offline"  // skip Razorpay for testing
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRINT SETTINGS END-TO-END VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── Step 1: Create the order ──────────────────────────────────────────────
  console.log('STEP 1: Sending order to backend...');
  console.log('Payload being sent:\n', JSON.stringify(TEST_ORDER, null, 2));
  console.log('');

  let orderId;
  try {
    const createRes = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_ORDER),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('❌ Failed to create order:', createRes.status, errText);
      return;
    }

    const createData = await createRes.json();
    orderId = createData.orderId;
    console.log('✅ Order created!');
    console.log('   Order ID:', orderId);
    console.log('   Response:', JSON.stringify(createData, null, 2));
    console.log('');
  } catch (err) {
    console.error('❌ Network error creating order:', err.message);
    return;
  }

  // ── Step 2: Fetch order back from backend ─────────────────────────────────
  console.log('STEP 2: Fetching order back from MongoDB...');
  
  try {
    const getRes = await fetch(`${BACKEND_URL}/orders/${orderId}`);
    if (!getRes.ok) {
      console.error('❌ Failed to fetch order:', getRes.status);
      return;
    }

    const order = await getRes.json();
    console.log('✅ Order retrieved from database!\n');

    // ── Show the stored file data ───────────────────────────────────────────
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  STORED IN MONGODB (per-file settings)');
    console.log('───────────────────────────────────────────────────────────────');
    
    for (let i = 0; i < order.files.length; i++) {
      const file = order.files[i];
      console.log(`\n  File ${i + 1}: ${file.fileName}`);
      console.log(`  ├─ pages (count):     ${file.pages}`);
      console.log(`  ├─ copies:            ${file.copies}`);
      console.log(`  ├─ colour:            ${file.colour}    ${file.colour ? '🎨 Color' : '⬛ B&W'}`);
      console.log(`  ├─ duplex:            ${file.duplex}    ${file.duplex ? '📄 Double-sided' : '📃 Single-sided'}`);
      console.log(`  ├─ orientation:       ${file.orientation || '❌ MISSING!'}`);
      console.log(`  ├─ pageRange:         ${file.pageRange || '❌ MISSING!'}`);
      console.log(`  └─ amount:            ₹${file.amount}`);
    }

    // ── Step 3: Simulate what printer.ts would build ────────────────────────
    console.log('\n\n───────────────────────────────────────────────────────────────');
    console.log('  WHAT pdf-to-printer WOULD RECEIVE (printer.ts output)');
    console.log('───────────────────────────────────────────────────────────────');

    for (let i = 0; i < order.files.length; i++) {
      const file = order.files[i];
      
      // This is EXACTLY what printer.ts builds:
      const printOptions = {
        copies: file.copies,
        monochrome: !file.colour,     // B&W = monochrome: true
        orientation: file.orientation || 'portrait',
      };

      // Page range: only set if not "all"
      if (file.pageRange && file.pageRange.toLowerCase() !== 'all') {
        printOptions.pages = file.pageRange;
      }

      if (file.duplex) {
        printOptions.side = 'duplex';
      }

      console.log(`\n  File ${i + 1}: ${file.fileName}`);
      console.log('  pdf-to-printer options:', JSON.stringify(printOptions, null, 4));
      
      // Show the equivalent SumatraPDF command
      const settings = [];
      if (printOptions.pages) settings.push(printOptions.pages);
      if (printOptions.copies > 1) settings.push(`${printOptions.copies}x`);
      if (printOptions.monochrome) settings.push('monochrome');
      else settings.push('color');
      settings.push(printOptions.orientation);
      if (printOptions.side) settings.push(printOptions.side);
      
      console.log(`  SumatraPDF equivalent: -print-settings "${settings.join(',')}"`);
    }

    // ── Verification summary ────────────────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('  VERIFICATION RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let allPass = true;
    for (const file of order.files) {
      const checks = [
        { name: 'colour stored correctly', pass: file.colour === false, expected: 'false (B&W)', got: String(file.colour) },
        { name: 'orientation stored',      pass: file.orientation === 'landscape', expected: 'landscape', got: file.orientation || 'MISSING' },
        { name: 'pageRange stored',        pass: file.pageRange === '1-3', expected: '1-3', got: file.pageRange || 'MISSING' },
        { name: 'copies stored',           pass: file.copies === 2, expected: '2', got: String(file.copies) },
        { name: 'duplex stored',           pass: file.duplex === true, expected: 'true', got: String(file.duplex) },
        { name: 'monochrome will be true', pass: !file.colour === true, expected: 'true', got: String(!file.colour) },
      ];

      for (const c of checks) {
        const icon = c.pass ? '✅' : '❌';
        if (!c.pass) allPass = false;
        console.log(`  ${icon} ${c.name.padEnd(28)} expected: ${c.expected.padEnd(12)} got: ${c.got}`);
      }
    }

    console.log(`\n  ${allPass ? '🎉 ALL CHECKS PASSED!' : '⚠️  SOME CHECKS FAILED — review above'}`);
    console.log('');

    // ── Cleanup: delete the test order ──────────────────────────────────────
    console.log('Cleaning up test order...');
    await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    console.log('✅ Test order cancelled.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

runTest();
