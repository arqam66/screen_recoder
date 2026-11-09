# Elephant-and-Goldfish Model (EGM) Blueprint

This document defines the architectural contracts, system invariants, and component boundaries for Screen Recorder under the Elephant-and-Goldfish Model (EGM).

---

## 1. High-Altitude Blueprint (Hay)

### 1.1 Architectural Vision & Tenets
- **Offline & Privacy-First**: Screen recording, webcam compositing, audio mixing, and file export occur strictly locally in-memory. Zero network transmission of media streams.
- **Process Isolation**: Secure split between the privileged Electron Main process (`main.js`) and unprivileged sandboxed Renderer process (`index.html`) through a strictly controlled IPC bridge (`preload.js`).
- **Resilient Media Pipeline**: Multi-hour continuous recording without memory leaks or buffer exhaustion via WebM stream chunking and fast EBML duration header patching.

### 1.2 System Topology
```
┌────────────────────────────────────────────────────────┐
│                   Electron Main (main.js)              │
│  - Window Management & Lifecycle                       │
│  - WASAPI Loopback Audio Flag Configuration            │
│  - desktopCapturer Source Enumeration                  │
│  - Native File Dialog & Local Disk Persistence         │
└───────────────────────────┬────────────────────────────┘
                            │ IPC Bridge (contextBridge)
┌───────────────────────────▼────────────────────────────┐
│                    Preload (preload.js)                │
│  - Context Isolation: window.electronAPI               │
│  - getSources() & saveFile(buffer, suggestedName)      │
└───────────────────────────┬────────────────────────────┘
                            │ Sandboxed DOM & Media APIs
┌───────────────────────────▼────────────────────────────┐
│                  Renderer (index.html)                 │
│  - Mode Selection (Screen, Camera, Screen + Camera)    │
│  - Canvas Compositing & Live Drawing / Laser Pointer   │
│  - Web Audio API Mixer (Mic + Loopback Audio)          │
│  - MediaRecorder & In-Memory Chunk Handling            │
│  - Accessible Single-Toggle Theme Switcher             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Package Contracts (Peanuts)

### 2.1 Electron Main Process (`main.js`)
- **Role**: Native runtime host, OS-level capabilities, display enumeration, and dialog management.
- **Invariants**:
  - `nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true` strictly enforced.
  - All external URL requests intercepted via `setWindowOpenHandler` and delegated to the default OS browser (`action: 'deny'`).
  - Application menu disabled (`Menu.setApplicationMenu(null)`).
- **Side Effects**:
  - Sets Chromium flags for WebRTC H.264/FFmpeg and WASAPI loopback capture.
  - Writes exported recordings directly to user-selected filesystem paths.

### 2.2 Context Isolation Bridge (`preload.js`)
- **Role**: Secure, typed gatekeeper between Node/Electron APIs and browser DOM.
- **Exported Interface**:
  ```typescript
  window.electronAPI = {
    getSources: () => Promise<Array<{ id: string, name: string, thumbnail: string }>>,
    saveFile: (data: { buffer: Uint8Array, suggestedName: string }) => Promise<boolean>
  }
  ```
- **Invariants**:
  - Exposes zero direct Node.js modules (`fs`, `child_process`, `ipcRenderer`).
  - Prevents prototype pollution and unauthorized renderer privilege escalation.

### 2.3 Renderer & Compositor Engine (`index.html`)
- **Role**: Visual user interface, theme management, audio/video mixing, user interaction, and client-side encoding.
- **Interface & Theme State**:
  - Single theme toggle button (`#themeBtn`) conforming to WAI-ARIA switch pattern (`role="switch"`, `aria-checked="true|false"`).
  - Theme cycles predictably: `dark` -> `light` -> `light-panda` -> `dark`.
  - CSS animations use standard hardware-accelerated transforms (`translateX(20px)` and `translateX(0)`).
- **Security & Compliance**:
  - Strict Content Security Policy (CSP) blocking unauthorized external script, style, and media sources.
- **Side Effects**:
  - Manages `MediaStream` tracks, `AudioContext` gain nodes, and recording blobs.
  - Persists user preferences (`sr-theme`, hotkey bindings) exclusively to `localStorage`.

