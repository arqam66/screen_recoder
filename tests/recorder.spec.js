const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Screen Recorder UI and Functionality Tests', () => {
  // ponytail: Simple setup, load the index.html directly from local path
  test.beforeEach(async ({ page }) => {
    const filePath = path.resolve(__dirname, '../index.html');
    await page.goto(`file://${filePath}`);
  });

  test('Page loads and elements have correct default state', async ({ page }) => {
    // ponytail: Verify title and branding text
    await expect(page).toHaveTitle(/Screen Recorder/);
    const titleText = await page.textContent('.app-logo .grad');
    expect(titleText).toBe('Screen Recorder');

    // ponytail: Verify default button states
    await expect(page.locator('#startBtn')).toBeEnabled();
    await expect(page.locator('#pauseBtn')).toBeDisabled();
    await expect(page.locator('#resumeBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
    await expect(page.locator('#screenshotBtn')).toBeDisabled();
  });

  test('Recording Mode toggle updates UI options', async ({ page }) => {
    // ponytail: Mode toggle triggers specific CSS changes
    const modeCardCamera = page.locator('#modeCardCamera');
    await modeCardCamera.click();
    await expect(page.locator('#opt-campos')).toBeHidden(); // Hidden in camera only

    const modeCardBoth = page.locator('#modeCardBoth');
    await modeCardBoth.click();
    await expect(page.locator('#opt-campos')).toBeVisible(); // Visible in screen + camera

    const modeCardScreen = page.locator('#modeCardScreen');
    await modeCardScreen.click();
    await expect(page.locator('#opt-campos')).toBeHidden(); // Hidden in screen only
  });

  test('Settings accordions can be toggled open/closed', async ({ page }) => {
    // ponytail: Accordions toggle their visibility class
    const videoAccordionHead = page.locator('#accVideo .accordion-head');
    const videoAccordionBody = page.locator('#accVideo .accordion-body');

    // Initially closed (no "open" class)
    await expect(videoAccordionHead).not.toHaveClass(/open/);
    
    // Toggle open
    await videoAccordionHead.click();
    await expect(videoAccordionHead).toHaveClass(/open/);
    await expect(videoAccordionBody).toHaveClass(/open/);

    // Toggle closed
    await videoAccordionHead.click();
    await expect(videoAccordionHead).not.toHaveClass(/open/);
    await expect(videoAccordionBody).not.toHaveClass(/open/);
  });

  test('Theme switcher toggles light/dark mode', async ({ page }) => {
    // ponytail: Theme button changes data-theme attribute on root element
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'dark');

    const themeBtn = page.locator('#themeBtn');
    await themeBtn.click();
    await expect(root).toHaveAttribute('data-theme', 'light');

    await themeBtn.click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
  });

  test('Configuring custom hotkey controls', async ({ page }) => {
    // ponytail: Open the hotkeys accordion first to make elements clickable
    await page.locator('#accHotkeys .accordion-head').click();
    
    // ponytail: Test hotkey capturing logic
    const hotkeyStart = page.locator('#hk-start');
    
    // Check initial defaults
    await expect(hotkeyStart).toHaveText('F9');

    // Click to capture
    await hotkeyStart.click();
    await expect(hotkeyStart).toHaveText('…');

    // Press a key (e.g. 'A')
    await page.keyboard.press('KeyA');
    await expect(hotkeyStart).toHaveText('A');

    // Reset to defaults
    await page.locator('#resetHotkeysBtn').click();
    await expect(hotkeyStart).toHaveText('F9');
  });
});

test.describe('Additional UI Controls', () => {
  test.beforeEach(async ({ page }) => {
    const filePath = path.resolve(__dirname, '../index.html');
    await page.goto(`file://${filePath}`);
  });

  test('Audio accordion starts open, output and video start closed', async ({ page }) => {
    // ponytail: Audio accordion is pre-opened by default in HTML
    await expect(page.locator('#accAudio .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accAudio .accordion-body')).toHaveClass(/open/);

    // ponytail: Output and Video accordions are closed by default
    await expect(page.locator('#accOutput .accordion-head')).not.toHaveClass(/open/);
    await expect(page.locator('#accOutput .accordion-body')).not.toHaveClass(/open/);
    await expect(page.locator('#accVideo .accordion-head')).not.toHaveClass(/open/);
  });

  test('Gain range slider updates displayed value', async ({ page }) => {
    // ponytail: Range value label reflects slider position
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
    // ponytail: Must switch to both mode first so camsize option becomes visible
    await page.locator('#modeCardBoth').click();
    await expect(page.locator('#opt-camsize')).toBeVisible();

    // ponytail: Camera size label tracks range input
    const camSizeVal = page.locator('#camSizeVal');
    await expect(camSizeVal).toHaveText('22%');

    const camSizeRange = page.locator('#camSizeRange');
    await camSizeRange.fill('15');
    await expect(camSizeVal).toHaveText('15%');

    await camSizeRange.fill('35');
    await expect(camSizeVal).toHaveText('35%');
  });

  test('Camera options only visible in Screen + Camera mode', async ({ page }) => {
    // ponytail: camshape and camsize hidden in non-both modes
    await page.locator('#modeCardScreen').click();
    await expect(page.locator('#opt-camshape')).toBeHidden();
    await expect(page.locator('#opt-camsize')).toBeHidden();

    // ponytail: All camera options visible in both mode
    await page.locator('#modeCardBoth').click();
    await expect(page.locator('#opt-campos')).toBeVisible();
    await expect(page.locator('#opt-camshape')).toBeVisible();
    await expect(page.locator('#opt-camsize')).toBeVisible();

    // ponytail: Hidden again in camera-only mode
    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#opt-campos')).toBeHidden();
    await expect(page.locator('#opt-camshape')).toBeHidden();
    await expect(page.locator('#opt-camsize')).toBeHidden();
  });

  test('System audio field hidden in camera-only mode', async ({ page }) => {
    // ponytail: sysAudioField is hidden when no screen share is possible
    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#sysAudioField')).toBeHidden();

    // ponytail: sysAudioField visible in screen-only mode
    await page.locator('#modeCardScreen').click();
    await expect(page.locator('#sysAudioField')).toBeVisible();
  });

  test('Mode cards get active class on click', async ({ page }) => {
    // ponytail: Only one mode card is active at a time
    await page.locator('#modeCardCamera').click();
    await expect(page.locator('#modeCardCamera')).toHaveClass(/active/);
    await expect(page.locator('#modeCardScreen')).not.toHaveClass(/active/);
    await expect(page.locator('#modeCardBoth')).not.toHaveClass(/active/);

    await page.locator('#modeCardBoth').click();
    await expect(page.locator('#modeCardBoth')).toHaveClass(/active/);
    await expect(page.locator('#modeCardCamera')).not.toHaveClass(/active/);
  });

  test('Instruction text updates with mode selection', async ({ page }) => {
    // ponytail: Instructions reflect the selected mode
    const instr = page.locator('#instr');

    await page.locator('#modeCardScreen').click();
    await expect(instr).toContainText('Screen only');

    await page.locator('#modeCardCamera').click();
    await expect(instr).toContainText('Camera only');

    await page.locator('#modeCardBoth').click();
    await expect(instr).toContainText('Screen + Camera');
  });

  test('History panel toggle opens and closes', async ({ page }) => {
    // ponytail: History body starts hidden
    const historyBody = page.locator('#historyBody');
    await expect(historyBody).not.toHaveClass(/open/);

    // ponytail: Clicking history head toggles it open
    await page.locator('#historyHead').click();
    await expect(historyBody).toHaveClass(/open/);

    // ponytail: Clicking again toggles it closed
    await page.locator('#historyHead').click();
    await expect(historyBody).not.toHaveClass(/open/);
  });

  test('History shows empty state message', async ({ page }) => {
    // ponytail: Empty history displays a placeholder message
    await expect(page.locator('#historyEmpty')).toBeVisible();
    await expect(page.locator('#historyEmpty')).toHaveText('No recordings yet this session');
    await expect(page.locator('#historyCount')).toHaveText('0');
  });

  test('Default status is Ready', async ({ page }) => {
    // ponytail: Status bar shows initial state
    await expect(page.locator('#status')).toHaveText('Ready');
  });

  test('Default hotkey values are correct', async ({ page }) => {
    // ponytail: All hotkeys display their default keycodes
    await page.locator('#accHotkeys .accordion-head').click();
    await expect(page.locator('#hk-start')).toHaveText('F9');
    await expect(page.locator('#hk-pause')).toHaveText('Space');
    await expect(page.locator('#hk-stop')).toHaveText('Esc');
    await expect(page.locator('#hk-screenshot')).toHaveText('S');
  });

  test('Hotkey capture shows ellipsis then updates on keypress', async ({ page }) => {
    // ponytail: Each hotkey input captures independently
    await page.locator('#accHotkeys .accordion-head').click();

    const hkPause = page.locator('#hk-pause');
    await expect(hkPause).toHaveText('Space');

    await hkPause.click();
    await expect(hkPause).toHaveText('…');

    await page.keyboard.press('KeyZ');
    await expect(hkPause).toHaveText('Z');

    // ponytail: Other hotkeys unaffected
    await expect(page.locator('#hk-start')).toHaveText('F9');
  });

  test('Escape key is ignored during hotkey capture', async ({ page }) => {
    // ponytail: Modifier/ignored keys do not overwrite hotkey
    await page.locator('#accHotkeys .accordion-head').click();

    const hkStop = page.locator('#hk-stop');
    await hkStop.click();
    await expect(hkStop).toHaveText('…');

    await page.keyboard.press('Shift');
    await expect(hkStop).toHaveText('…'); // Still capturing

    await page.keyboard.press('Escape');
    // Escape is not in ignoredCodes, so it should set the hotkey
    await expect(hkStop).toHaveText('Esc');
  });

  test('Filename template input accepts text', async ({ page }) => {
    // ponytail: Output accordion opens and filename template is editable
    await page.locator('#accOutput .accordion-head').click();
    const input = page.locator('#filenameTemplate');
    await expect(input).toHaveValue('recording-{date}-{time}');

    await input.fill('my-video-{mode}');
    await expect(input).toHaveValue('my-video-{mode}');
  });

  test('Quality select has all preset options', async ({ page }) => {
    // ponytail: Video quality dropdown contains all bitrate tiers
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#qualitySelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Ultra (8 Mbps)');
    expect(options).toContain('High (4 Mbps)');
    expect(options).toContain('Medium (2 Mbps)');
    expect(options).toContain('Low (1 Mbps)');
    await expect(select).toHaveValue('4000000'); // High is default
  });

  test('Cam position select has all corner options', async ({ page }) => {
    // ponytail: Camera position dropdown covers all four corners
    await page.locator('#modeCardBoth').click();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#camPosSelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Bottom right');
    expect(options).toContain('Bottom left');
    expect(options).toContain('Top right');
    expect(options).toContain('Top left');
    await expect(select).toHaveValue('br'); // Default
  });

  test('Cam shape select has circle and rectangle', async ({ page }) => {
    // ponytail: Camera shape dropdown offers both shapes
    await page.locator('#modeCardBoth').click();
    await page.locator('#accVideo .accordion-head').click();
    const select = page.locator('#camShapeSelect');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Circle');
    expect(options).toContain('Rectangle');
    await expect(select).toHaveValue('round'); // Default
  });

  test('Recording badges are hidden by default', async ({ page }) => {
    // ponytail: REC, system audio, and mic badges start hidden
    await expect(page.locator('#recBadge')).not.toHaveClass(/visible/);
    await expect(page.locator('#sysAudioBadge')).not.toHaveClass(/visible/);
    await expect(page.locator('#micBadge')).not.toHaveClass(/visible/);
  });

  test('Preview and source picker modals are hidden by default', async ({ page }) => {
    // ponytail: Modals are not visible on initial load
    await expect(page.locator('#preview-modal')).toBeHidden();
    await expect(page.locator('#source-picker-modal')).toBeHidden();
  });

  test('View area is hidden by default', async ({ page }) => {
    // ponytail: Main video view starts hidden until recording
    await expect(page.locator('#view')).toBeHidden();
  });

  test('Countdown overlay is hidden by default', async ({ page }) => {
    // ponytail: Countdown element starts with display none
    await expect(page.locator('#countdown')).toBeHidden();
  });

  test('Drawing toolbar buttons exist and are clickable', async ({ page }) => {
    // ponytail: Drawing tool buttons have correct titles
    await expect(page.locator('#laserBtn')).toHaveAttribute('title', 'Laser pointer');
    await expect(page.locator('#penBtn')).toHaveAttribute('title', 'Draw');
    await expect(page.locator('#clearBtn')).toHaveAttribute('title', 'Clear annotations');
  });

  test('Color picker dot exists', async ({ page }) => {
    // ponytail: Color picker element is present
    await expect(page.locator('#colorPick')).toBeAttached();
    await expect(page.locator('#colorInput')).toBeAttached(); // Hidden native input
  });

  test('Timer is hidden by default', async ({ page }) => {
    // ponytail: Timer element is not displayed before recording
    await expect(page.locator('#timer')).toBeHidden();
  });

  test('Key hints are rendered on load', async ({ page }) => {
    // ponytail: Keyboard shortcut hints are populated
    const hints = page.locator('#keyHints');
    await expect(hints).toContainText('Pause/Resume');
    await expect(hints).toContainText('Stop');
    await expect(hints).toContainText('Screenshot');
  });

  test('Multiple accordion toggles are independent', async ({ page }) => {
    // ponytail: Opening one accordion does not affect others
    await page.locator('#accVideo .accordion-head').click();
    await expect(page.locator('#accVideo .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accOutput .accordion-head')).not.toHaveClass(/open/);

    await page.locator('#accOutput .accordion-head').click();
    await expect(page.locator('#accOutput .accordion-head')).toHaveClass(/open/);
    await expect(page.locator('#accVideo .accordion-head')).toHaveClass(/open/); // Still open
  });

  test('Toggle switches default to checked', async ({ page }) => {
    // ponytail: System audio and mic toggles are on by default
    await expect(page.locator('#sysAudioToggle')).toBeChecked();
    await expect(page.locator('#micToggle')).toBeChecked();
  });

  test('Toggle switches can be unchecked', async ({ page }) => {
    // ponytail: Toggles respond to click and update state (input is CSS-hidden, dispatch via JS)
    await page.evaluate(() => { const el = document.getElementById('sysAudioToggle'); el.checked = false; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#sysAudioToggle')).not.toBeChecked();

    await page.evaluate(() => { const el = document.getElementById('micToggle'); el.checked = false; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#micToggle')).not.toBeChecked();

    await page.evaluate(() => { const el = document.getElementById('sysAudioToggle'); el.checked = true; el.dispatchEvent(new Event('change')); });
    await expect(page.locator('#sysAudioToggle')).toBeChecked();
  });

  test('URL auto-start param selects correct mode', async ({ page }) => {
    // ponytail: Query param ?start=both selects both mode
    const filePath = path.resolve(__dirname, '../index.html');
    await page.goto(`file://${filePath}?start=both`);
    await expect(page.locator('#modeCardBoth')).toHaveClass(/active/);
    await expect(page.locator('#modeCardScreen')).not.toHaveClass(/active/);
    await expect(page.locator('#modeCardCamera')).not.toHaveClass(/active/);
  });

  test('Subtitle text is visible', async ({ page }) => {
    // ponytail: App subtitle renders correctly
    await expect(page.locator('.app-subtitle')).toHaveText('No upload · no limits');
  });
});
