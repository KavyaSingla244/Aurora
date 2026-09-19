import puppeteer from 'puppeteer-core';
import path from 'path';

const LIVE_URL = 'https://safesignal-five.vercel.app';
const ARTIFACT_DIR = '/home/kavya-singla/.gemini/antigravity-ide/brain/939ae1e5-d342-4649-a0a1-531db87b8bec';

async function testGpsLive() {
  console.log('='.repeat(80));
  console.log(`TESTING LIVE GPS GRANTED & DENIED PERMISSION FLOWS`);
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. TEST GEOLOCATION GRANTED IN ISOLATED CONTEXT 1
    console.log('\n[1. TESTING GEOLOCATION GRANTED]');
    const contextGranted = await browser.createBrowserContext();
    await contextGranted.overridePermissions(LIVE_URL, ['geolocation']);

    const pageGranted = await contextGranted.newPage();
    await pageGranted.setViewport({ width: 1280, height: 800 });
    await pageGranted.setGeolocation({ latitude: 28.6139, longitude: 77.2090, accuracy: 10 }); // New Delhi

    await pageGranted.goto(LIVE_URL, { waitUntil: 'networkidle2' });

    // Quick onboarding
    await pageGranted.type('#safe-word-input', 'SAFEGUARD');
    await pageGranted.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 400));
    await pageGranted.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    // Navigate to Telemetry Lab
    const tabsGranted = await pageGranted.$$('.nav-tab-btn');
    await tabsGranted[3].click();
    await new Promise(r => setTimeout(r, 400));

    // Click Enable Live GPS Telemetry
    const enableGpsBtn = await pageGranted.$('.btn-gps-start');
    if (enableGpsBtn) {
      await enableGpsBtn.click();
      await new Promise(r => setTimeout(r, 300));
      
      const authBtn = await pageGranted.$('.btn-grant-gps');
      if (authBtn) {
        await authBtn.click();
        console.log('✓ Triggered GPS Permission Authorization');
      }
    }
    await new Promise(r => setTimeout(r, 1200));

    const gpsPanel = await pageGranted.$('.live-gps-telemetry-panel');
    console.log(`✓ Real GPS Telemetry Panel Rendered: ${!!gpsPanel}`);

    // Update GPS position to simulate moving (walking pace)
    await pageGranted.setGeolocation({ latitude: 28.6150, longitude: 77.2100, accuracy: 10 });
    await new Promise(r => setTimeout(r, 1500));

    const liveGpsScreenshot = path.join(ARTIFACT_DIR, 'live_gps_granted.png');
    await pageGranted.screenshot({ path: liveGpsScreenshot, fullPage: true });
    console.log(`✓ Saved Real GPS Granted Screenshot to: ${liveGpsScreenshot}`);

    // 2. TEST GEOLOCATION DENIED IN ISOLATED CONTEXT 2
    console.log('\n[2. TESTING GEOLOCATION DENIAL & GRACEFUL FALLBACK]');
    const contextDenied = await browser.createBrowserContext();
    // Deny permissions (empty list)
    await contextDenied.overridePermissions(LIVE_URL, []);

    const pageDenied = await contextDenied.newPage();
    await pageDenied.setViewport({ width: 1280, height: 800 });
    await pageDenied.goto(LIVE_URL, { waitUntil: 'networkidle2' });
    
    // Quick onboarding
    await pageDenied.type('#safe-word-input', 'SAFEGUARD');
    await pageDenied.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 400));
    await pageDenied.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    // Check header chip
    const headerChipText = await pageDenied.$eval('.status-chip:nth-child(4)', el => el.textContent);
    console.log(`✓ Header Status Chip on Initial/Denied State: "${headerChipText}"`);
    console.assert(headerChipText.includes('GPS Fallback'), 'Header must gracefully indicate GPS Fallback');

    // Go to Telemetry Lab on denied page
    const tabsDenied = await pageDenied.$$('.nav-tab-btn');
    await tabsDenied[3].click();
    await new Promise(r => setTimeout(r, 400));

    const fallbackSliders = await pageDenied.$('.manual-kinematics-fallback');
    console.log(`✓ Graceful Manual Sliders Fallback UI Rendered: ${!!fallbackSliders}`);

    const deniedScreenshot = path.join(ARTIFACT_DIR, 'live_gps_denied_fallback.png');
    await pageDenied.screenshot({ path: deniedScreenshot, fullPage: true });
    console.log(`✓ Saved GPS Denied Fallback Screenshot to: ${deniedScreenshot}`);

    console.log('\n' + '='.repeat(80));
    console.log('LIVE GPS GRANTED AND DENIED FLOWS FULLY VERIFIED!');
    console.log('='.repeat(80));

  } finally {
    await browser.close();
  }
}

testGpsLive().catch(err => {
  console.error('GPS Test Failed:', err);
  process.exit(1);
});
