// Quick test script to verify browse requests page loads
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting browser test for /requests page fix...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 Navigating to http://localhost:3000/requests');
    await page.goto('http://localhost:3000/requests', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a moment for any client-side rendering
    await page.waitForTimeout(2000);

    // Check if error page is shown
    const hasError = await page.locator('text=Something Went Wrong').isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ FAILED: "Something Went Wrong" error page is still showing');
      console.log('\n📸 Taking screenshot of error...');
      await page.screenshot({ path: 'browse-error.png', fullPage: true });

      // Get any console errors
      console.log('\n🔍 Page console logs:');
      page.on('console', msg => console.log(`  ${msg.type()}: ${msg.text()}`));

      process.exit(1);
    } else {
      console.log('✅ SUCCESS: No "Something Went Wrong" error detected!');

      // Check if we're redirected to login (expected if not authenticated)
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      if (currentUrl.includes('/login')) {
        console.log('✅ EXPECTED: Redirected to login (user not authenticated)');
      } else if (currentUrl.includes('/requests')) {
        // Check if request cards are visible
        const hasCards = await page.locator('[data-testid="request-card"]').count() > 0;
        if (hasCards) {
          const cardCount = await page.locator('[data-testid="request-card"]').count();
          console.log(`✅ SUCCESS: ${cardCount} request cards found!`);
        } else {
          console.log('⚠️  Page loaded but no request cards found (might be no data)');
        }
      }

      console.log('\n📸 Taking success screenshot...');
      await page.screenshot({ path: 'browse-success.png', fullPage: true });
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'browse-test-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
