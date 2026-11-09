# Screen Recorder for Windows

A powerful, privacy-first desktop screen recorder for Windows 10 & 11 — built with Electron. Record your screen, camera, or both with system audio capture, annotation tools, and instant local download. No uploads, no accounts, no limits.

[![Version](https://img.shields.io/badge/version-1.3.0-7c73ff?style=for-the-badge)](https://github.com/arqam66/screen_recoder/releases/tag/v1.3.0)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4?style=for-the-badge&logo=windows)](https://github.com/arqam66/screen_recoder/releases)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-78%20passing-brightgreen?style=for-the-badge)](https://github.com/arqam66/screen_recoder/actions)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Download](#download)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
  - [From Release (Recommended)](#from-release-recommended)
  - [From Source](#from-source)
- [How to Record](#how-to-record)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Privacy & Security](#privacy--security)
- [Project Structure](#project-structure)
- [Architecture Models](#architecture-models)
  - [High-Level Blueprint](#high-level-blueprint)
  - [Component Package Contracts](#component-package-contracts)
  - [Data Flow Model](#data-flow-model)
- [Loop Engineering / Scrum Process](#loop-engineering--scrum-process)
  - [Loop Topology](#loop-topology)
  - [Stage Definitions](#stage-definitions)
  - [Verification Scoring Metrics](#verification-scoring-metrics)
- [Testing](#testing)
- [Chrome Extension (Companion)](#chrome-extension-companion)
  - [Extension Features](#extension-features)
  - [How to Load the Extension](#how-to-load-the-extension)
- [Release History](#release-history)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Overview

Screen Recorder is a desktop application for Windows that lets you capture your screen, webcam, or both simultaneously. It is built on Electron 31.7.7 and runs entirely locally — no media ever leaves your machine. The app is designed for long, unattended captures (multi-hour) with low memory overhead, and it includes real-time annotation (laser pointer and pen drawing), system audio capture via WASAPI loopback, microphone mixing with a Web Audio API mixer, and an in-session history panel with thumbnails.

---

## Features

| Feature | Description |
|---------|-------------|
| **Screen Recording** | Record any window, tab, or full screen via the native source picker |
| **Camera Recording** | Webcam-only recording with microphone |
| **Screen + Camera** | Screen with face-cam overlay (circle or rectangle, 4 positions, adjustable size) |
| **System Audio** | Captures device audio via WASAPI loopback — no virtual cable needed |
| **Microphone** | Mix mic voice alongside system audio in real time |
| **Audio Mixer** | Web Audio API gain control with real-time VU meter |
| **Resolution Control** | 720p (1280×720) default, changeable up to 1080p (1920×1080) max |
| **Annotations** | Draw on screen while recording with the pen tool |
| **Laser Pointer** | Real-time laser pointer rendered into the video |
| **Screenshot** | Capture PNG snapshots any time during recording |
| **Hotkeys** | Fully customizable keyboard shortcuts |
| **Non-stop Recording** | Recording keeps running until you click Stop — no confirmation dialog |
| **Local Save** | Save as WebM or MP4 — files never leave your machine |
| **History Panel** | In-session recording history with thumbnails, preview, and re-download |
| **Themes** | Dark, Light, and Light Panda themes — one button toggles between them |
| **Countdown Timer** | 3-second countdown before recording starts (cancellable) |
| **Filename Templates** | `{date}`, `{time}`, `{mode}` tokens in output filename |
| **Multi-hour Timer** | `hh:mm:ss` format for long recordings |
| **WebM Duration Fix** | Exact duration metadata injected so players seek correctly |

---

## Download

| File | Description | Size |
|------|-------------|------|
| [**Setup (.exe)**](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen.Recorder-Setup-1.3.0.exe) | Install permanently — Start Menu & Desktop shortcuts, uninstaller | ~75 MB |
| [**Portable (.exe)**](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen.Recorder-1.3.0.exe) | Run directly — no installation needed | ~75 MB |

**Requirements:** Windows 10 or 11 (64-bit)

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
5. **3-second countdown** — recording begins automatically (cancellable)
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
- **Context isolation enabled** — renderer is sandboxed from Node.js (`contextIsolation: true`, `nodeIntegration: false`)
- **XSS prevention** — all user input sanitized via `textContent`
- **Filename sanitization** — dangerous characters stripped from output names
- **Strict Content Security Policy (CSP)** — blocks unauthorized external script, style, and media sources
- **External links** — opened in the default OS browser, never inside the app

---

## Project Structure

```
screen_recorder/
├── main.js                 # Electron main process — window, IPC, permissions
├── preload.js              # Secure IPC bridge (contextBridge)
├── index.html              # Entire renderer UI (HTML + CSS + JavaScript)
├── assets/
│   └── icon.ico            # App icon
├── package.json            # Electron + electron-builder config
├── tests/                  # Playwright e2e tests (78 tests)
│   └── recorder.spec.js
├── playwright.config.js    # Playwright test configuration
├── vercel.json             # Vercel deployment config
├── chrome-extension/       # Browser companion extension (Manifest V3, v2.0.0)
│   ├── manifest.json
│   ├── background.js
│   ├── recorder.html
│   └── recorder.js
├── scripts/
│   ├── record-demo.mjs     # Playwright demo recorder
│   └── publish_release.py  # GitHub release automation script
├── release/                # Build output (gitignored)
│   ├── Screen Recorder-Setup-1.3.0.exe      (NSIS Installer ~75 MB)
│   └── Screen Recorder-1.3.0.exe            (Portable EXE ~74 MB)
├── README.md               # This file
├── EGM.md                  # Elephant-and-Goldfish Model architecture blueprint
├── LOOP.md                 # Loop Engineering operational specification
├── STATE.md                # Loop Engineering state & verification trace
└── .gitignore
```

---

## Architecture Models

The application is designed under the **Elephant-and-Goldfish Model (EGM)**, documented in `EGM.md`. Below is a summary of the architectural models.

### High-Level Blueprint

```
┌─────────────────────────────────────────────────────────────┐
│              Electron Main (main.js)                        │
│  - Window Management & Lifecycle                            │
│  - WASAPI Loopback Audio Flag Configuration                 │
│  - desktopCapturer Source Enumeration                       │
│  - Native File Dialog & Local Disk Persistence              │
└───────────────────────────┬─────────────────────────────────┘
                            │ IPC Bridge (contextBridge)
┌───────────────────────────▼─────────────────────────────────┐
│                    Preload (preload.js)                     │
│  - Context Isolation: window.electronAPI                    │
│  - getSources() & saveFile(buffer, suggestedName)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ Sandboxed DOM & Media APIs
┌───────────────────────────▼─────────────────────────────────┐
│                  Renderer (index.html)                      │
│  - Mode Selection (Screen, Camera, Screen + Camera)         │
│  - Canvas Compositing & Live Drawing / Laser Pointer        │
│  - Web Audio API Mixer (Mic + Loopback Audio)               │
│  - MediaRecorder & In-Memory Chunk Handling                 │
│  - Accessible Single-Toggle Theme Switcher                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Package Contracts

| Component | Role | Key Invariants |
|-----------|------|----------------|
| **Electron Main** (`main.js`) | Native runtime host, OS capabilities, display enumeration, dialog management | `nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true`; external URLs delegated to OS browser; application menu disabled |
| **Preload Bridge** (`preload.js`) | Secure typed gatekeeper between Node/Electron APIs and browser DOM | Exposes zero direct Node.js modules (`fs`, `child_process`, `ipcRenderer`); prevents prototype pollution |
| **Renderer** (`index.html`) | Visual UI, theme management, audio/video mixing, user interaction, client-side encoding | Strict CSP; preferences persisted exclusively to `localStorage`; no network transmission of media |

### Data Flow Model

1. **Source Selection** — `desktopCapturer.getSources()` enumerates screens/windows; user picks one via the source picker modal.
2. **Stream Capture** — `navigator.mediaDevices.getUserMedia` / `getDisplayMedia` captures video + optional system audio (WASAPI loopback).
3. **Audio Mixing** — System audio and microphone tracks are routed through a Web Audio `AudioContext` → `MediaStreamDestination` for unified gain control and VU metering.
4. **Compositing** — In Screen + Camera mode, screen and camera streams are drawn onto an offscreen `<canvas>` at the target FPS; `canvas.captureStream()` produces the final video track.
5. **Recording** — `MediaRecorder` encodes the combined stream into WebM chunks (1-second chunks for low memory overhead on long recordings).
6. **Duration Patch** — `fixWebmDuration()` injects exact duration metadata into the Matroska Segment Info header (memory-safe: slices only the first 128 KB header).
7. **Save** — User selects a path via the native save dialog; the blob is written to disk locally.

---

## Loop Engineering / Scrum Process

This project follows a formal **Loop Engineering** operational framework for autonomous development cycles, continuous verification, and regression prevention (see `LOOP.md`). The process is organized like a scrum-style loop with bounded assignments, minimal fixes, independent verification, and state reporting.

### Loop Topology

```
[ 1. Discovery & Triage ] ──> [ 2. Bounded Assignment ] ──> [ 3. Maker (Minimal Fix) ]
                                                                        │
[ 5. State & Release ]   <── [ 4. Checker (Verifier) ]  <──────────────┘
```

### Stage Definitions

| Stage | Name | Purpose |
|-------|------|---------|
| 1 | **Discovery & Triage** | Automated detection of test regressions, build failures, accessibility/visual bugs, and dependency security alerts. |
| 2 | **Bounded Assignment** | Scope is strictly constrained to specific components. Zero unrelated refactoring or cosmetic churn allowed. |
| 3 | **Maker** (Minimal Fix) | Implements minimal atomic changes adhering to established EGM contracts. Complies with local styles, CSP constraints, and architecture invariants. |
| 4 | **Checker** (Verifier) | Independent verifier operates with a default stance of `REJECT`. Runs the complete Playwright suite validating functional flows, visual contracts, and security invariants. |
| 5 | **State & Release** | Updates `STATE.md` with execution trace, test results, and release provenance; tags and publishes release artifacts. |

### Verification Scoring Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Test Pass Rate** | 100% (78/78 passing) | ✅ PASS |
| **Security Check** | TruffleHog secrets scan = 0 findings; CSP enabled | ✅ PASS |
| **Binary Integrity** | Both NSIS Setup and Portable binaries built and hashed | ✅ PASS |
| **Theme Switcher** | CSS syntax & smooth transform | ✅ PASS |
| **Electron Build** | NSIS + Portable x64 | ✅ PASS |

---

## Testing

The project includes **78 Playwright end-to-end tests** covering UI defaults, mode toggling, accordions, theme switching, hotkey capture, sliders, filename templates, audio toggles, geometry calculations, duration patching, and more.

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all 78 e2e tests
npx playwright test

# Run tests with a UI report
npx playwright test --ui
```

Test categories:
- **UI and Functionality** — default state, mode toggles, accordions, theme cycle, hotkeys, sliders, templates, status, badges, modals, drawing tools
- **Multi-Hour & Fast-Motion Engine** — `fmtTime` formatting, `fixWebmDuration` memory safety, screen constraints, camera geometry, filename token expansion
- **Audio** — system/mic toggles, gain slider range and real-time updates
- **Visual** — canvas, video elements, drawing toolbar, color picker, preview modal, timer, history panel, control state transitions, countdown overlay
- **Compatibility & Platform** — platform detection, viewport dimensions

---

## Chrome Extension (Companion)

A fully-featured Manifest V3 companion extension is included in `chrome-extension/` (v2.0.0). It opens a floating recorder window that stays open when you switch tabs, so recording continues uninterrupted.

### Extension Features

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

### How to Load the Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Click the extension icon to open the floating recorder window

---

## Release History

### v1.3.0 (Current)

| Artifact | Filename | SHA-256 |
|----------|----------|---------|
| Installer | `Screen Recorder-Setup-1.3.0.exe` | `F7F34129EB79283D0EAB00D5671232CEE766766173507897C63A7273EB395C64` |
| Portable | `Screen Recorder-1.3.0.exe` | `7D011197AF652104D3387F9A5AA05D5E05CD335AE3B275B55A52B564FB928EC2` |

**What's New in v1.3.0**
- Theme Toggle Switch — smooth animated switch toggling Dark, Light, and Light Panda themes
- Strict Content Security Policy (CSP) — enhanced application security and injection protection
- Audio & Video Pipeline — WASAPI loopback audio, microphone mixing, and multi-hour stream recording
- Elephant-and-Goldfish Model (EGM) & Loop Engineering — formalized architectural contracts and verification workflows
- 78 Playwright e2e tests — full coverage of UI, audio, visual, and engine behavior
- Chrome Extension v2.0.0 — Manifest V3 companion with floating recorder window

### v1.2.x and earlier
Earlier versions focused on core screen/camera recording, basic annotations, and the initial Electron shell. See GitHub Releases for full history.

---

## Contributing

1. Fork the repository and create a feature branch from `main`
2. Make your change following the Loop Engineering process (minimal atomic change, no unrelated refactoring)
3. Run the full Playwright suite: `npx playwright test` (must be 78/78 passing)
4. Verify no secrets are committed (TruffleHog scan = 0 findings)
5. Open a Pull Request describing the change and which loop stage it satisfies

---

## License

MIT © 2026 Arqam

---

## Support

- **Issues:** [GitHub Issues](https://github.com/arqam66/screen_recoder/issues)
- **Releases:** [GitHub Releases](https://github.com/arqam66/screen_recoder/releases)

