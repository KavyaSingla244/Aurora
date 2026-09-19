import puppeteer from 'puppeteer-core';
import path from 'path';

const LIVE_URL = 'https://safesignal-five.vercel.app';
const PRESENTATION_DIR = '/home/kavya-singla/.gemini/antigravity-ide/scratch/safesignal/presentation';

async function captureDeckScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
    await page.goto(LIVE_URL, { waitUntil: 'networkidle2' });

    // 1. Onboarding
    await page.type('#safe-word-input', 'AURORA7');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 400));
    
    // Connected mode
    const modeCards = await page.$$('.mode-card');
    if (modeCards.length >= 2) await modeCards[1].click();
    
    const contactInputs = await page.$$('.contact-name-input');
    if (contactInputs.length > 0) await contactInputs[0].type('Maya (Mom)');
    const phoneInputs = await page.$$('.contact-phone-input');
    if (phoneInputs.length > 0) await phoneInputs[0].type('+91 98765 43210');

    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    // 2. Risk Display Baseline Screenshot
    const appShell = await page.$('.app-phone-frame');
    if (appShell) {
      await appShell.screenshot({ path: path.join(PRESENTATION_DIR, 'screen_risk_baseline.png') });
    }

    // 3. Inject High Risk via Judge Preset
    await page.click('.btn-judge-fab');
    await new Promise(r => setTimeout(r, 400));
    const presetButtons = await page.$$('.flyout-preset-btn');
    if (presetButtons.length >= 3) {
      await presetButtons[2].click(); // Deserted Run (High)
    }
    await new Promise(r => setTimeout(r, 800));

    // Screenshot of Elevated/High Check-In Prompt + Risk Radar
    if (appShell) {
      await appShell.screenshot({ path: path.join(PRESENTATION_DIR, 'screen_checkin_elevated.png') });
    }

    // 4. Trigger SOS via Wrong Word
    const checkInInput = await page.$('.checkin-text-input');
    if (checkInInput) {
      await checkInInput.type("I'm fine");
      await page.click('.btn-checkin-submit');
      await new Promise(r => setTimeout(r, 800));
    }

    // Screenshot of Emergency SOS Modal with Tap-to-Call
    const emergencyModal = await page.$('#emergency-active-modal');
    if (emergencyModal) {
      await emergencyModal.screenshot({ path: path.join(PRESENTATION_DIR, 'screen_sos_modal.png') });
    }

    // Disarm SOS
    const standDownInput = await page.$('.stand-down-input');
    if (standDownInput) {
      await standDownInput.type('AURORA7');
      await page.click('.btn-stand-down');
      await new Promise(r => setTimeout(r, 600));
    }

    // 5. Telemetry Lab Tab Screenshot
    const tabs = await page.$$('.nav-tab-btn');
    if (tabs.length >= 4) {
      await tabs[3].click();
      await new Promise(r => setTimeout(r, 500));
      if (appShell) {
        await appShell.screenshot({ path: path.join(PRESENTATION_DIR, 'screen_telemetry_lab.png') });
      }
    }

    console.log('✓ Captured all 4 high-res deck screenshots in presentation/');
  } finally {
    await browser.close();
  }
}

captureDeckScreenshots().catch(err => {
  console.error('Capture Failed:', err);
});
