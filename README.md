# Screen Recorder for Windows

A powerful, privacy-first desktop screen recorder for Windows 10 & 11 — built with Electron. Record your screen, camera, or both with system audio capture, annotation tools, and instant local download. No uploads, no accounts, no limits.

[![Version](https://img.shields.io/badge/version-1.3.0-7c73ff?style=for-the-badge)](https://github.com/arqam66/screen_recoder/releases/tag/v1.3.0)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4?style=for-the-badge&logo=windows)](https://github.com/arqam66/screen_recoder/releases)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

---

## Download

| File | Description | Size |
|------|-------------|------|
| [**Setup (.exe)**](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen%20Recorder-Setup-1.3.0.exe) | Install permanently — Start Menu & Desktop shortcuts, uninstaller | ~75 MB |
| [**Portable (.exe)**](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen%20Recorder-1.3.0.exe) | Run directly — no installation needed | ~75 MB |

**Requirements:** Windows 10 or 11 (64-bit)

---

## Features

| Feature | Description |
|---------|-------------|
| **Screen Recording** | Record any window, tab, or full screen via native picker |
| **Camera Recording** | Webcam-only recording with microphone |
| **Screen + Camera** | Screen with face-cam overlay (circle or rectangle, 4 positions, adjustable size) |
| **System Audio** | Captures device audio via WASAPI loopback — no virtual cable needed |
| **Microphone** | Mix mic voice alongside system audio in real time |
| **Audio Mixer** | Web Audio API gain control with real-time VU meter |
| **Resolution Control** | 720p (1280×720) default, changeable up to 1080p (1920×1080) max |
| **Annotations** | Draw on screen while recording with pen tool |
| **Laser Pointer** | Real-time laser pointer rendered into the video |
| **Screenshot** | Capture PNG snapshots any time during recording |
| **Hotkeys** | Fully customizable keyboard shortcuts |
| **Non-stop Recording** | Recording keeps running until you click Stop — no confirmation dialog |
| **Local Save** | Save as WebM or MP4 — files never leave your machine |
| **History Panel** | In-session recording history with thumbnails, preview, and re-download |
| **Themes** | Dark, Light, and Light Panda themes — one button toggles between them |
| **Countdown Timer** | 3-second countdown before recording starts (cancellable) |
| **Filename Templates** | `{date}`, `{time}`, `{mode}` tokens in output filename |

---

## Quick Start

### From Release (Recommended)
1. Download **Screen Recorder-Setup-1.3.0.exe** from the [Releases page](https://github.com/arqam66/screen_recoder/releases)
2. Run the installer — it adds Start Menu and Desktop shortcuts
3. Launch "Screen Recorder" from your Start Menu
4. Select your recording mode, pick your screen/window, and click **Start**

### From Source
```bash
# Clone the repository
git clone https://github.com/arqam66/screen_recoder.git
cd screen_recoder

# Install dependencies
npm install

# Run in development
npm start

# Build release (produces NSIS installer + portable EXE in /release)
npm run build
```

---

## How to Record

1. **Launch** the Screen Recorder app
2. **Choose mode:** Screen only, Camera only, or Screen + Camera
3. **Configure settings:** Resolution (720p default / 1080p max), Frame Rate, Audio toggles
4. **Click Start** — select your screen or window from the picker
5. **3-second countdown** — recording begins automatically
6. **Work normally** — switch to your tab or app and record
7. **Click Stop** — preview opens automatically
8. **Save** as WebM or MP4 to any location on your PC

---

## Keyboard Shortcuts

| Action | Default Key |
|--------|-------------|
| Start Recording | `F9` |
| Pause / Resume | `Space` |
| Stop Recording | `Escape` |
| Screenshot | `S` |

Hotkeys are fully customizable in the Keyboard Shortcuts panel.

---

## Privacy & Security

- **No network requests** — everything runs locally on your machine
- **No data collection** — no analytics, no telemetry, no tracking
- **Files stay on your machine** — saved directly via native save dialog
- **Context isolation enabled** — renderer is sandboxed from Node.js
- **XSS prevention** — all user input sanitized via `textContent`
- **Filename sanitization** — dangerous characters stripped from output names

---

## Project Structure

```
screen_recorder/
├── main.js           # Electron main process — window, IPC, permissions
├── preload.js        # Secure IPC bridge (contextBridge)
├── index.html        # Entire renderer UI (HTML + CSS + JavaScript)
├── assets/
│   └── icon.ico      # App icon
├── package.json      # Electron + electron-builder config
├── tests/            # Playwright e2e tests (78 tests)
├── playwright.config.js
├── chrome-extension/ # Browser companion extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── recorder.html
│   └── recorder.js
├── scripts/
│   └── record-demo.mjs
└── release/          # Build output
    ├── Screen Recorder-Setup-1.3.0.exe   (NSIS Installer ~75 MB)
    └── Screen Recorder-1.3.0.exe          (Portable EXE ~74 MB)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)                            │
│  ├── BrowserWindow, Menu, IPC handlers                      │
│  ├── Permission handlers (media, display-capture, etc.)     │
│  └── IPC: get-sources, save-file                            │
├─────────────────────────────────────────────────────────────┤
│  Preload Bridge (contextBridge)                             │
│  └── Exposes electronAPI to renderer (secure IPC)           │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (index.html)                              │
│  ├── UI Layer — Sidebar, Controls, Modals                   │
│  ├── Recording Engine — MediaRecorder (WebM/MP4)            │
│  ├── Audio Mixer — Web Audio API, GainNode, AnalyserNode   │
│  ├── Annotation Engine — Canvas2D, Laser / Pen Tool         │
│  └── History Manager — Thumbnails, Blob URLs                │
└─────────────────────────────────────────────────────────────┘
        OS / Hardware: desktopCapturer, WASAPI Loopback,
        Camera, Microphone, File System
```

---

## Testing

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all 78 e2e tests
npx playwright test
```

---

## Chrome Extension

A fully-featured Manifest V3 companion extension is included in `chrome-extension/` (v2.0.0). It opens a floating recorder window that stays open when you switch tabs, so recording continues uninterrupted.

### Chrome Extension Features

| Feature | Description |
|---------|-------------|
| **3 Recording Modes** | Screen only, Camera only, Screen + Camera with face overlay |
| **Theme Switcher** | Dark, Light, and Light Panda themes — persisted across sessions |
| **MP4 & WebM Export** | Download as WebM or MP4 from the preview modal |
| **Filename Templates** | `{date}`, `{time}`, `{mode}` tokens in output filename |
| **Multi-hour Timer** | `hh:mm:ss` format for long recordings |
| **Gain Control** | Real-time microphone/audio gain slider with VU meter |
| **History Panel** | In-session thumbnail history with preview & re-download |
| **Annotation Tools** | Laser pointer & pen drawing in Screen + Camera mode |
| **System Audio** | Capture tab/desktop audio with toggle |
| **Customizable Filename** | Editable save name in the preview modal |

### How to load it

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `chrome-extension/` folder

---

## License

MIT © 2026 Arqam

---

## Support

- **Issues:** [GitHub Issues](https://github.com/arqam66/screen_recoder/issues)
- **Releases:** [GitHub Releases](https://github.com/arqam66/screen_recoder/releases)
- **Discussions:** [GitHub Discussions](https://github.com/arqam66/screen_recoder/discussions)