# 🎬 Screen Recorder

> A powerful, privacy-first desktop screen recorder for Windows 10 & 11 — built with Electron. No uploads, no accounts, no limits.

[![Version](https://img.shields.io/badge/version-1.2.0-7c73ff?style=flat-square)](https://github.com/arqam66/screen_recoder/releases/tag/v1.2.0)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows)](https://github.com/arqam66/screen_recoder/releases)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## 📥 Download

| File | Description |
|---|---|
| [**Screen Recorder Setup 1.2.0.exe**](https://github.com/arqam66/screen_recoder/releases/download/v1.2.0/Screen.Recorder.Setup.1.2.0.exe) | Full installer — Start Menu & Desktop shortcuts, uninstaller |
| [**Screen-Recorder-1.2.0-portable.exe**](https://github.com/arqam66/screen_recoder/releases/download/v1.2.0/Screen-Recorder-1.2.0-portable.exe) | Portable — run directly, no installation needed |

**Requirements:** Windows 10 or 11 (64-bit)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖥️ **Screen Recording** | Record any window, tab, or full screen via native picker |
| 📷 **Camera Recording** | Webcam-only recording with microphone |
| 🎬 **Screen + Camera** | Screen with face-cam overlay (circle or rectangle, 4 positions, adjustable size) |
| 🔊 **System Audio** | Captures device audio via WASAPI loopback — no virtual cable needed |
| 🎤 **Microphone** | Mix mic voice alongside system audio in real time |
| 🎚️ **Audio Mixer** | Web Audio API gain control, real-time VU meter |
| ✏️ **Annotations** | Draw on screen while recording with pen tool |
| 🔴 **Laser Pointer** | Real-time laser pointer rendered into the video |
| 📸 **Screenshot** | Capture PNG snapshots any time during recording |
| ⌨️ **Hotkeys** | Fully customizable keyboard shortcuts |
| 💾 **Local Save** | Save as WebM or MP4 — files never leave your machine |
| 🕘 **History Panel** | In-session recording history with thumbnails, preview, and re-download |
| 🌙 **Dark / Light Theme** | Persisted theme toggle |
| ⏱️ **Countdown Timer** | 3-second countdown before recording starts (cancellable) |
| 📁 **Filename Templates** | `{date}`, `{time}`, `{mode}` tokens in output filename |

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Electron Main Process (Node.js)"
        MAIN["main.js\n─────────────\nBrowserWindow\nMenu\nIPC Handlers"]
        PERM["Permission Handlers\n─────────────\nsetPermissionCheckHandler\nsetPermissionRequestHandler\nsetDisplayMediaRequestHandler"]
        IPC_MAIN["IPC Handlers\n─────────────\nipcMain: get-sources\nipcMain: save-file"]
        MAIN --> PERM
        MAIN --> IPC_MAIN
    end

    subgraph "Preload Bridge (preload.js)"
        BRIDGE["contextBridge\n─────────────\nexposeInMainWorld:\n electronAPI.getSources()\n electronAPI.saveFile()"]
    end

    subgraph "Renderer Process (index.html)"
        UI["UI Layer\n─────────────\nSidebar Controls\nMain Panel\nModals / Overlays"]
        REC["Recording Engine\n─────────────\nMediaRecorder (WebM)\nMediaRecorder (MP4)\nCanvas Compositor"]
        AUDIO["Audio Mixer\n─────────────\nWeb Audio API\nGainNode\nAnalyserNode"]
        DRAW["Annotation Engine\n─────────────\nCanvas2D\nLaser / Pen Tool"]
        HIST["History Manager\n─────────────\nIn-memory store\nThumbnail generator\nBlob URLs"]
        UI --> REC
        REC --> AUDIO
        REC --> DRAW
        REC --> HIST
    end

    IPC_MAIN <-->|"contextBridge IPC"| BRIDGE
    BRIDGE <--> UI

    subgraph "OS / Hardware"
        SCREEN["Display Capture\n(desktopCapturer)"]
        WASAPI["WASAPI Loopback\n(System Audio)"]
        CAM["Camera\n(getUserMedia)"]
        MIC["Microphone\n(getUserMedia)"]
        FS["File System\n(dialog + fs.writeFile)"]
    end

    IPC_MAIN --> SCREEN
    IPC_MAIN --> FS
    REC --> WASAPI
    REC --> CAM
    REC --> MIC
```

---

## 🗂️ Project Structure

```
screen_recorder/
├── main.js           # Electron main process — window, IPC, permissions
├── preload.js        # Secure IPC bridge (contextBridge)
├── index.html        # Entire renderer: HTML + CSS + JavaScript (SPA)
├── assets/
│   └── icon.ico      # App icon (used in installer & taskbar)
├── package.json      # Electron + electron-builder config
├── release/          # Build output (gitignored)
│   ├── Screen Recorder Setup 1.2.0.exe
│   └── Screen-Recorder-1.2.0-portable.exe
├── chrome-extension/ # Browser companion extension
├── tests/            # Playwright e2e tests
└── playwright.config.js
```

---

## 📐 Component Diagram

```mermaid
graph LR
    subgraph "Sidebar"
        MODES["Mode Selector\n• Screen only\n• Camera only\n• Screen + Camera"]
        ACC_VID["Video Accordion\n• Quality preset\n• Cam position\n• Cam shape/size"]
        ACC_AUD["Audio Accordion\n• System audio toggle\n• Microphone toggle\n• Volume slider"]
        ACC_OUT["Output Accordion\n• Filename template"]
        ACC_HK["Hotkeys Accordion\n• Start / Pause\n• Stop / Screenshot\n• Reset to defaults"]
    end

    subgraph "Main Panel"
        CTRL["Control Bar\n▶ Start | ⏸ Pause\n⏵ Resume | ⏹ Stop | 📸"]
        STATUS["Status Bar\n• Status text\n• Recording timer\n• Audio VU meter"]
        PREVIEW["Live Preview\n• mainVideo (screen/cam)\n• composite canvas (both)"]
        DRAWTOOLS["Draw Toolbar\n🔴 Laser | ✏️ Pen\n🗑 Clear | Color picker"]
        HIST_PANEL["History Panel\n• Thumbnail grid\n• Duration / size\n• Download / Delete"]
    end

    subgraph "Overlays / Modals"
        COUNTDOWN["Countdown Overlay\n3 → 2 → 1 → Start"]
        SRC_PICKER["Source Picker Modal\nWindow / screen thumbs"]
        PREV_MODAL["Preview Modal\n• Video preview\n• WebM / MP4 save\n• Filename input"]
    end

    MODES --> CTRL
    ACC_VID --> PREVIEW
    ACC_AUD --> STATUS
    CTRL --> COUNTDOWN
    COUNTDOWN --> SRC_PICKER
    SRC_PICKER --> PREVIEW
    CTRL --> PREV_MODAL
    PREVIEW --> DRAWTOOLS
    PREV_MODAL --> HIST_PANEL
```

---

## 🔄 Recording State Machine

```mermaid
stateDiagram-v2
    [*] --> Ready : App launch

    Ready --> WaitingSource : Click ▶ Start\n(screen / both mode)
    Ready --> WaitingCamera : Click ▶ Start\n(camera mode)

    WaitingSource --> Countdown : Source selected
    WaitingSource --> Ready : Cancelled

    WaitingCamera --> Countdown : Camera granted
    WaitingCamera --> Ready : Permission denied

    Countdown --> Recording : 3s elapsed
    Countdown --> Ready : ESC / Cancel clicked

    Recording --> Paused : Click ⏸ Pause\nor hotkey
    Paused --> Recording : Click ⏵ Resume\nor hotkey

    Recording --> Stopping : Click ⏹ Stop\nor hotkey
    Paused --> Stopping : Click ⏹ Stop

    Stopping --> Preview : Blobs assembled
    Preview --> Ready : Discard recording
    Preview --> Ready : File saved (WebM/MP4)

    Recording --> Screenshot : 📸 or hotkey S\n(stays in Recording)
```

---

## 🔀 Sequence Diagram — Screen + Camera Recording

```mermaid
sequenceDiagram
    actor User
    participant UI as Renderer (UI)
    participant IPC as Preload Bridge
    participant Main as Main Process
    participant OS as OS / Hardware

    User->>UI: Click ▶ Start (mode = "both")
    UI->>IPC: electronAPI.getSources()
    IPC->>Main: ipcMain "get-sources"
    Main->>OS: desktopCapturer.getSources()
    OS-->>Main: [{id, name, thumbnail}]
    Main-->>IPC: sources array
    IPC-->>UI: sources array
    UI->>UI: Render Source Picker Modal
    User->>UI: Click a window thumbnail
    UI->>UI: Close modal, store sourceId

    UI->>OS: getUserMedia({chromeMediaSource:"desktop", id})
    OS-->>UI: screenStream (video + WASAPI audio)

    UI->>OS: getUserMedia({video:true, audio:false})
    OS-->>UI: camStream (camera video)

    UI->>UI: setupAudioMixer(screenStream, wantMic)
    Note over UI: AudioContext → GainNode → AnalyserNode → Dest
    UI->>UI: waitForVideo(screenVid) + waitForVideo(camVid)
    UI->>UI: runCountdown(3)
    UI->>User: Show "3 → 2 → 1" overlay

    UI->>UI: MediaRecorder.start() [WebM + MP4]
    UI->>UI: startDraw(screenVid, camVid) — 30fps canvas loop
    UI->>User: Show live composite preview + draw toolbar

    loop Every frame (30 fps)
        UI->>UI: ctx.drawImage(screenVid)
        UI->>UI: drawCamOverlay(camVid)
        UI->>UI: ctx.drawImage(drawingCanvas)
    end

    User->>UI: Click ⏹ Stop
    UI->>UI: MediaRecorder.stop()
    UI->>UI: Assemble Blob from chunks
    UI->>UI: Show Preview Modal
    User->>UI: Click "Save as MP4"
    UI->>IPC: electronAPI.saveFile(blob, filename)
    IPC->>Main: ipcMain "save-file"
    Main->>User: Native Save Dialog
    User->>Main: Choose path
    Main->>OS: fs.writeFileSync(path, buffer)
    Main-->>IPC: true
    IPC-->>UI: saved = true
    UI->>UI: addHistoryEntry(...)
```

---

## 🎵 Audio Pipeline Diagram

```mermaid
flowchart LR
    subgraph Sources
        SYS["🔊 WASAPI Loopback\n(System Audio Track)"]
        MIC_SRC["🎤 Microphone Track\n(getUserMedia)"]
    end

    subgraph "Web Audio API (AudioContext)"
        SYS_STREAM["MediaStream\n(sys track only)"]
        MIC_STREAM["MediaStream\n(mic track only)"]
        SYS_NODE["MediaStreamSource\n(system)"]
        MIC_NODE["MediaStreamSource\n(mic)"]
        GAIN_SYS["GainNode\n(volume slider 0–200%)"]
        GAIN_MIC["GainNode\n(fixed 1.0)"]
        ANALYSER["AnalyserNode\n(FFT 256 bins)\n→ VU Meter"]
        DEST["MediaStreamDestination\n(mixed output)"]
    end

    MIXED["🎧 Mixed Audio Track\n→ MediaRecorder"]

    SYS --> SYS_STREAM --> SYS_NODE --> GAIN_SYS --> ANALYSER
    SYS --> SYS_STREAM --> SYS_NODE --> GAIN_SYS --> DEST
    MIC_SRC --> MIC_STREAM --> MIC_NODE --> GAIN_MIC --> ANALYSER
    MIC_SRC --> MIC_STREAM --> MIC_NODE --> GAIN_MIC --> DEST
    DEST --> MIXED
```

---

## 📹 Canvas Compositor (Screen + Camera Mode)

```mermaid
flowchart TD
    SCREEN_VID["screenVid\n(HTMLVideoElement\noffscreen)"]
    CAM_VID["camVid\n(HTMLVideoElement\noffscreen)"]
    DRAW_CANVAS["drawingCanvas\n(offscreen annotation\nlayer)"]
    LASER["Laser dot\n(mouseX, mouseY)"]

    COMPOSITE["composite\n&lt;canvas&gt;\n(visible in UI)"]

    SCREEN_VID -->|"ctx.drawImage\n(full frame)"| COMPOSITE
    CAM_VID -->|"drawCamOverlay()\n(clipped circle/rect\nwith border)"| COMPOSITE
    DRAW_CANVAS -->|"ctx.drawImage\n(annotation layer)"| COMPOSITE
    LASER -->|"ctx.arc (red dot\n+ glow shadow)"| COMPOSITE

    COMPOSITE -->|"canvas.captureStream(30)\n→ videoTrack"| MEDIARECORDER["MediaRecorder\n(WebM + MP4)"]
```

---

## 🖥️ IPC Architecture

```mermaid
graph TD
    subgraph "Renderer (Sandboxed)"
        R1["window.electronAPI.getSources()"]
        R2["window.electronAPI.saveFile(blob, name)"]
    end

    subgraph "preload.js (contextBridge)"
        P1["ipcRenderer.invoke('get-sources')"]
        P2["blob.arrayBuffer() →\nBuffer.from(arrayBuffer) →\nipcRenderer.invoke('save-file', {buffer, name})"]
    end

    subgraph "main.js (Node.js)"
        M1["ipcMain.handle('get-sources')\n→ desktopCapturer.getSources()\n→ [{id, name, thumbnail.toDataURL()}]"]
        M2["ipcMain.handle('save-file')\n→ dialog.showSaveDialog()\n→ fs.writeFileSync(path, buffer)"]
    end

    R1 --> P1 --> M1
    R2 --> P2 --> M2
```

---

## ⌨️ Hotkeys

| Action | Default Key | Configurable |
|---|---|---|
| Start Recording | `F9` | ✅ |
| Pause / Resume | `Space` | ✅ |
| Stop Recording | `Escape` | ✅ |
| Screenshot | `S` | ✅ |

> Hotkeys are saved to `localStorage` and persist across sessions. Reset to defaults anytime from the Hotkeys panel.

---

## 📦 Output Formats

| Format | Codec | Notes |
|---|---|---|
| **WebM** | VP8/VP9 + Opus | Always available — plays in Chrome, Edge, VLC |
| **MP4** | H.264 + AAC | Available if Chromium/Electron supports `video/mp4;codecs=avc1` |

Filename supports tokens: `{date}`, `{time}`, `{mode}` — e.g. `recording-2026-07-15-14-30-00-screen`

---

## 🛠️ Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Windows 10 or 11 (for native builds)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/arqam66/screen_recoder.git
cd screen_recoder

# Install dependencies
npm install

# Run in development
npm start
```

### Build Release

```bash
# Produces NSIS installer + portable exe in /release
npm run build
```

| Output | Path |
|---|---|
| NSIS Installer | `release/Screen Recorder Setup 1.2.0.exe` |
| Portable Exe | `release/Screen-Recorder-1.2.0-portable.exe` |

---

## 🔒 Privacy & Security

- ✅ **No network requests** — everything runs locally
- ✅ **No data collection** — no analytics, no telemetry
- ✅ **Files stay on your machine** — saved directly via native dialog
- ✅ **Context isolation enabled** — renderer sandboxed from Node.js
- ✅ **XSS prevention** — user input sanitized via `textContent` / `sanitizeInput()`
- ✅ **Filename sanitization** — dangerous characters stripped from output names

---

## 🧪 Running Tests

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run e2e tests
npx playwright test
```

---

## 📄 License

MIT © 2026 Arqam
