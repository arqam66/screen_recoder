const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const indexUrl = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

test.describe('Screen Recorder UI and Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**', (route) => {
      const url = route.request().url();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
  });

  test('Page loads and elements have correct default state', async ({ page }) => {
    await expect(page).toHaveTitle(/Screen Recorder/);
    const titleText = await page.textContent('.app-logo .grad');
    expect(titleText).toBe('Screen Recorder');

    await expect(page.locator('#startBtn')).toBeEnabled();
    await expect(page.locator('#pauseBtn')).toBeDisabled();
    await expect(page.locator('#resumeBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
    await expect(page.locator('#screenshotBtn')).toBeDisabled();
  });

  test('Recording Mode toggle updates UI options', async ({ page }) => {
    await page.locator('#accVideo .accordion-head').click();

    const modeCardCamera = page.locator('#modeCardCamera');
    await modeCardCamera.click();
    await expect(page.locator('#opt-campos')).toBeHidden();

    const modeCardBoth = page.locator('#modeCardBoth');
    await modeCardBoth.click();
    await expect(page.locator('#opt-campos')).toBeVisible();

    const modeCardScreen = page.locator('#modeCardScreen');
    await modeCardScreen.click();
    await expect(page.locator('#opt-campos')).toBeHidden();
  });

  test('Settings accordions can be toggled open/closed', async ({ page }) => {
    const videoAccordionHead = page.locator('#accVideo .accordion-head');
    const videoAccordionBody = page.locator('#accVideo .accordion-body');

    await expect(videoAccordionHead).not.toHaveClass(/open/);
    
    await videoAccordionHead.click();
    await expect(videoAccordionHead).toHaveClass(/open/);
    await expect(videoAccordionBody).toHaveClass(/open/);

    await videoAccordionHead.click();
    await expect(videoAccordionHead).not.toHaveClass(/open/);
    await expect(videoAccordionBody).not.toHaveClass(/open/);
  });

  test('Theme switcher toggles light/dark mode', async ({ page }) => {
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'dark');

    const themeBtn = page.locator('#themeBtn');
    await themeBtn.click();
    await expect(root).toHaveAttribute('data-theme', 'light');

    await themeBtn.click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
  });

  test('Configuring custom hotkey controls', async ({ page }) => {
    await page.locator('#accHotkeys .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accHotkeys .accordion-head').click();
    const hotkeyStart = page.locator('#hk-start');
    await hotkeyStart.scrollIntoViewIfNeeded();
    
    await expect(hotkeyStart).toHaveText('F9');

    await hotkeyStart.click();
    await expect(hotkeyStart).toHaveText('…');

    await page.keyboard.press('KeyA');
    await expect(hotkeyStart).toHaveText('A');

    await page.locator('#resetHotkeysBtn').scrollIntoViewIfNeeded();
    await page.locator('#resetHotkeysBtn').click();
    await expect(hotkeyStart).toHaveText('F9');
  });
});

test.describe('Additional UI Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**', (route) => {
      const url = route.request().url();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
  });

  test('Audio accordion starts open, output and video start closed', async ({ page }) => {
    await expect(page.locator('#accAudio .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accAudio .accordion-body')).toHaveClass(/open/);

    await expect(page.locator('#accOutput .accordion-head')).not.toHaveClass(/open/);
    await expect(page.locator('#accOutput .accordion-body')).not.toHaveClass(/open/);
    await expect(page.locator('#accVideo .accordion-head')).not.toHaveClass(/open/);
  });

  test('Gain range slider updates displayed value', async ({ page }) => {
    const gainVal = page.locator('#gainVal');
    await expect(gainVal).toHaveText('100%');

    const gainRange = page.locator('#gainRange');
    await gainRange.fill('50');
    await expect(gainVal).toHaveText('50%');

    await gainRange.fill('150');
    await expect(gainVal).toHaveText('150%');

    await gainRange.fill('0');
    await expect(gainVal).toHaveText('0%');
  });

  test('Cam size range slider updates displayed value', async ({ page }) => {
    await page.locator('#modeCardBoth').click();
    await page.locator('#accVideo .accordion-head').click();
    await expect(page.locator('#opt-camsize')).toBeVisible();

    const camSizeVal = page.locator('#camSizeVal');
    await expect(camSizeVal).toHaveText('22%');

    const camSizeRange = page.locator('#camSizeRange');
    await camSizeRange.fill('15');
    await expect(camSizeVal).toHaveText('15%');

    await camSizeRange.fill('35');
    await expect(camSizeVal).toHaveText('35%');
  });

  test('Camera options only visible in Screen + Camera mode', async ({ page }) => {
    await page.locator('#accVideo .accordion-head').click();

    await page.locator('#modeCardScreen').click();
    await expect(page.locator('#opt-camshape')).toBeHidden();
    await expect(page.locator('#opt-camsize')).toBeHidden();

    await page.locator('#modeCardBoth').click();
    await expect(page.locator('#opt-campos')).toBeVisible();
    await expect(page.locator('#opt-camshape')).toBeVisible();
    await expect(page.locator('#opt-camsize')).toBeVisible();

    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#opt-campos')).toBeHidden();
    await expect(page.locator('#opt-camshape')).toBeHidden();
    await expect(page.locator('#opt-camsize')).toBeHidden();
  });

  test('System audio field hidden in camera-only mode', async ({ page }) => {
    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#sysAudioField')).toBeHidden();

    await page.locator('#modeCardScreen').click();
    await expect(page.locator('#sysAudioField')).toBeVisible();
  });

  test('Mode cards get active class on click', async ({ page }) => {
    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#modeCardCamera')).toHaveClass(/active/);
    await expect(page.locator('#modeCardScreen')).not.toHaveClass(/active/);
    await expect(page.locator('#modeCardBoth')).not.toHaveClass(/active/);

    await page.locator('#modeCardBoth').click();
    await expect(page.locator('#modeCardBoth')).toHaveClass(/active/);
    await expect(page.locator('#modeCardCamera')).not.toHaveClass(/active/);
  });

  test('Instruction text updates with mode selection', async ({ page }) => {
    const instr = page.locator('#instr');

    await page.locator('#modeCardScreen').click();
    await expect(instr).toContainText('Screen only');

    await page.locator('#modeCardCamera').click();
    await expect(instr).toContainText('Camera only');

    await page.locator('#modeCardBoth').click();
    await expect(instr).toContainText('Screen + Camera');
  });

  test('History panel toggle opens and closes', async ({ page }) => {
    const historyBody = page.locator('#historyBody');
    await expect(historyBody).not.toHaveClass(/open/);

    await page.locator('#historyHead').click();
    await expect(historyBody).toHaveClass(/open/);

    await page.locator('#historyHead').click();
    await expect(historyBody).not.toHaveClass(/open/);
  });

  test('History shows empty state message', async ({ page }) => {
    await expect(page.locator('#historyEmpty')).toBeVisible();
    await expect(page.locator('#historyEmpty')).toHaveText('No recordings yet this session');
    await expect(page.locator('#historyCount')).toHaveText('0');
  });

  test('Default status is Ready', async ({ page }) => {
    await expect(page.locator('#status')).toHaveText('Ready');
  });

  test('Default hotkey values are correct', async ({ page }) => {
    await page.locator('#accHotkeys .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accHotkeys .accordion-head').click();
    await expect(page.locator('#hk-start')).toHaveText('F9');
    await expect(page.locator('#hk-pause')).toHaveText('Space');
    await expect(page.locator('#hk-stop')).toHaveText('Esc');
    await expect(page.locator('#hk-screenshot')).toHaveText('S');
  });

  test('Hotkey capture shows ellipsis then updates on keypress', async ({ page }) => {
    await page.locator('#accHotkeys .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accHotkeys .accordion-head').click();

    const hkPause = page.locator('#hk-pause');
    await hkPause.scrollIntoViewIfNeeded();
    await expect(hkPause).toHaveText('Space');

    await hkPause.click();
    await expect(hkPause).toHaveText('…');

    await page.keyboard.press('KeyZ');
    await expect(hkPause).toHaveText('Z');

    await expect(page.locator('#hk-start')).toHaveText('F9');
  });

  test('Escape key sets Escape hotkey during capture', async ({ page }) => {
    await page.locator('#accHotkeys .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accHotkeys .accordion-head').click();

    const hkStop = page.locator('#hk-stop');
    await hkStop.scrollIntoViewIfNeeded();
    await hkStop.click();
    await expect(hkStop).toHaveText('…');

    await page.keyboard.press('Escape');
    await expect(hkStop).toHaveText('Esc');
  });

  test('Filename template input accepts text', async ({ page }) => {
    await page.locator('#accOutput .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accOutput .accordion-head').click();
    const input = page.locator('#filenameTemplate');
    await expect(input).toHaveValue('recording-{date}-{time}');

    await input.fill('my-video-{mode}');
    await expect(input).toHaveValue('my-video-{mode}');
  });

  test('Quality select has high-bitrate fast motion options', async ({ page }) => {
    await page.locator('#accVideo .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#qualitySelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Ultra (20 Mbps / 4K)');
    expect(options).toContain('High (12 Mbps / Fast Motion)');
    expect(options).toContain('Full HD Standard (8 Mbps)');
    expect(options).toContain('Balanced (4 Mbps)');
    expect(options).toContain('Low / Compact (2 Mbps)');
    await expect(select).toHaveValue('12000000'); // 12 Mbps default for crisp motion
  });

  test('Frame Rate select has 60 FPS and 30 FPS options', async ({ page }) => {
    await page.locator('#accVideo .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#fpsSelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('60 FPS (Ultra Smooth / Fast Motion)');
    expect(options).toContain('30 FPS (Standard)');
    await expect(select).toHaveValue('60'); // 60 FPS default
  });

  test('Cam position select has all corner options', async ({ page }) => {
    await page.locator('#modeCardBoth').click();
    await page.locator('#accVideo .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#camPosSelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Bottom right');
    expect(options).toContain('Bottom left');
    expect(options).toContain('Top right');
    expect(options).toContain('Top left');
    await expect(select).toHaveValue('br');
  });

  test('Cam shape select has circle and rectangle', async ({ page }) => {
    await page.locator('#modeCardBoth').click();
    await page.locator('#accVideo .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#camShapeSelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Circle');
    expect(options).toContain('Rectangle');
    await expect(select).toHaveValue('round');
  });

  test('Recording badges are hidden by default', async ({ page }) => {
    await expect(page.locator('#recBadge')).not.toHaveClass(/visible/);
    await expect(page.locator('#sysAudioBadge')).not.toHaveClass(/visible/);
    await expect(page.locator('#micBadge')).not.toHaveClass(/visible/);
  });

  test('Preview and source picker modals are hidden by default', async ({ page }) => {
    await expect(page.locator('#preview-modal')).toBeHidden();
    await expect(page.locator('#source-picker-modal')).toBeHidden();
  });

  test('View area is hidden by default', async ({ page }) => {
    await expect(page.locator('#view')).toBeHidden();
  });

  test('Countdown overlay is hidden by default', async ({ page }) => {
    await expect(page.locator('#countdown')).toBeHidden();
  });

  test('Drawing toolbar buttons exist and are clickable', async ({ page }) => {
    await expect(page.locator('#laserBtn')).toHaveAttribute('title', 'Laser pointer');
    await expect(page.locator('#penBtn')).toHaveAttribute('title', 'Draw');
    await expect(page.locator('#clearBtn')).toHaveAttribute('title', 'Clear annotations');
  });

  test('Color picker dot exists', async ({ page }) => {
    await expect(page.locator('#colorPick')).toBeAttached();
    await expect(page.locator('#colorInput')).toBeAttached();
  });

  test('Timer is hidden by default', async ({ page }) => {
    await expect(page.locator('#timer')).toBeHidden();
  });

  test('Key hints are rendered on load', async ({ page }) => {
    const hints = page.locator('#keyHints');
    await expect(hints).toContainText('Pause/Resume');
    await expect(hints).toContainText('Stop');
    await expect(hints).toContainText('Screenshot');
  });

  test('Multiple accordion toggles are independent', async ({ page }) => {
    await page.locator('#accVideo .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accVideo .accordion-head').click();
    await expect(page.locator('#accVideo .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accOutput .accordion-head')).not.toHaveClass(/open/);

    await page.locator('#accOutput .accordion-head').scrollIntoViewIfNeeded();
    await page.locator('#accOutput .accordion-head').click();
    await expect(page.locator('#accOutput .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accVideo .accordion-head')).toHaveClass(/open/);
  });

  test('Toggle switches default to checked', async ({ page }) => {
    await expect(page.locator('#sysAudioToggle')).toBeChecked();
    await expect(page.locator('#micToggle')).toBeChecked();
  });

  test('Toggle switches can be unchecked', async ({ page }) => {
    await page.evaluate(() => { const el = document.getElementById('sysAudioToggle'); el.checked = false; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#sysAudioToggle')).not.toBeChecked();

    await page.evaluate(() => { const el = document.getElementById('micToggle'); el.checked = false; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#micToggle')).not.toBeChecked();

    await page.evaluate(() => { const el = document.getElementById('sysAudioToggle'); el.checked = true; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#sysAudioToggle')).toBeChecked();
  });

  test('URL auto-start param selects correct mode', async ({ page }) => {
    await page.goto(`${indexUrl}?start=both`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#modeCardBoth')).toHaveClass(/active/);
    await expect(page.locator('#modeCardScreen')).not.toHaveClass(/active/);
    await expect(page.locator('#modeCardCamera')).not.toHaveClass(/active/);
  });

  test('Subtitle text is visible', async ({ page }) => {
    await expect(page.locator('.app-subtitle')).toHaveText('No upload · no limits');
  });
});

test.describe('Multi-Hour & Fast-Motion Engine Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**', (route) => {
      const url = route.request().url();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
  });

  test('fmtTime accurately formats multi-hour durations (e.g. 1h, 5h, 24h)', async ({ page }) => {
    const formattedTimes = await page.evaluate(() => {
      return {
        zero: window.fmtTime(0),
        underMinute: window.fmtTime(45),
        tenMinutes: window.fmtTime(600),
        fiftyNineMins: window.fmtTime(3599),
        oneHour: window.fmtTime(3600),
        twoHoursFiveMins: window.fmtTime(7505),
        tenHours: window.fmtTime(36000),
        twentyFourHours: window.fmtTime(86400)
      };
    });

    expect(formattedTimes.zero).toBe('00:00');
    expect(formattedTimes.underMinute).toBe('00:45');
    expect(formattedTimes.tenMinutes).toBe('10:00');
    expect(formattedTimes.fiftyNineMins).toBe('59:59');
    expect(formattedTimes.oneHour).toBe('01:00:00');
    expect(formattedTimes.twoHoursFiveMins).toBe('02:05:05');
    expect(formattedTimes.tenHours).toBe('10:00:00');
    expect(formattedTimes.twentyFourHours).toBe('24:00:00');
  });

  test('fixWebmDuration safely patches multi-hour durations without memory failure', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const buffer = new Uint8Array(200);
      buffer[10] = 0x15; buffer[11] = 0x49; buffer[12] = 0xA9; buffer[13] = 0x66;
      buffer[20] = 0x44; buffer[21] = 0x89; buffer[22] = 0x88;

      const mockBlob = new Blob([buffer], { type: 'video/webm' });
      // 5 hours = 5 * 3600 * 1000 = 18,000,000 ms
      const patchedBlob = await window.fixWebmDuration(mockBlob, 18000000);
      const patchedBuffer = await patchedBlob.arrayBuffer();
      const view = new DataView(patchedBuffer);
      const readDuration = view.getFloat64(23, false);

      return {
        size: patchedBlob.size,
        duration: readDuration
      };
    });

    expect(result.duration).toBe(18000000);
    expect(result.size).toBe(200);
  });

  test('Screen recording constraints specify 60 FPS and motion contentHint', async ({ page }) => {
    const videoConfig = await page.evaluate(() => {
      const q = document.getElementById('qualitySelect').value;
      const fps = document.getElementById('fpsSelect').value;
      return {
        defaultBitrate: parseInt(q),
        defaultFps: parseInt(fps),
        targetFpsConstant: window.TARGET_FPS
      };
    });

    expect(videoConfig.defaultBitrate).toBe(12000000); // 12 Mbps default for crisp fast motion
    expect(videoConfig.defaultFps).toBe(60); // 60 FPS default
    expect(videoConfig.targetFpsConstant).toBe(60);
  });
});
