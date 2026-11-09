import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const INDEX_URL = 'file://' + path.resolve('index.html').replace(/\\/g, '/');

async function recordDemo() {
  fs.mkdirSync('./recordings', { recursive: true });

  const browser = await chromium.launch({ slowMo: 70 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: './recordings', size: { width: 1920, height: 1080 } },
  });

  const page = await context.newPage();

  await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // 1. Show default state
  await page.waitForTimeout(1000);

  // 2. Switch to Camera mode
  await page.click('#modeCardCamera');
  await page.waitForTimeout(700);

  // 3. Switch to Screen + Camera mode
  await page.click('#modeCardBoth');
  await page.waitForTimeout(700);

  // 4. Open video accordion and change resolution to 1080p
  await page.click('#accVideo .accordion-head');
  await page.waitForTimeout(400);
  await page.selectOption('#resolutionSelect', '1080p');
  await page.waitForTimeout(400);

  // 5. Change quality to Low (2 Mbps)
  await page.selectOption('#qualitySelect', '2000000');
  await page.waitForTimeout(400);

  // 6. Adjust cam size slider
  await page.fill('#camSizeRange', '30');
  await page.waitForTimeout(400);

  // 7. Toggle system audio off
  await page.evaluate(() => {
    const el = document.getElementById('sysAudioToggle');
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(400);

  // 8. Switch back to Screen mode
  await page.click('#modeCardScreen');
  await page.waitForTimeout(700);

  // 9. Toggle theme
  await page.click('#themeBtn');
  await page.waitForTimeout(700);
  await page.click('#themeBtn');
  await page.waitForTimeout(700);

  // 10. Open hotkeys and capture a new key
  await page.click('#accHotkeys .accordion-head');
  await page.waitForTimeout(400);
  await page.click('#hk-start');
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyK');
  await page.waitForTimeout(400);

  // 11. Final hold on the screen
  await page.waitForTimeout(1200);

  await context.close();
  await browser.close();

  // Move the recorded video to a stable name
  const files = fs.readdirSync('./recordings').filter(f => f.endsWith('.webm'));
  if (files.length) {
    const src = path.join('./recordings', files[0]);
    const dest = path.join('./recordings', 'screen-recorder-demo.webm');
    fs.renameSync(src, dest);
    console.log('Recording saved to:', dest);
  }
}

recordDemo().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
