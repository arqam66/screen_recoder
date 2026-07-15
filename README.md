# Premium Screen Recorder

A professional, client-side screen recorder with real-time facecam overlays, advanced audio mixing, canvas annotation tools, and instant local downloads. No cloud, no uploads, no account required—100% of the recording and rendering runs locally in your browser or desktop environment.

---

## 🌟 Key Features

| Feature | Details |
| :--- | :--- |
| **🎬 Multi-Mode Recording** | **Screen Only:** Capture any tab, window, or entire display.<br>**Camera Only:** High-definition webcam recorder for talking head videos.<br>**Screen + Camera:** Picture-in-Picture composite overlay of your face on the screen. |
| **⚙️ Configurable Facecam** | Position facecam in any corner (Bottom-Right, Bottom-Left, Top-Right, Top-Left).<br>Toggle shape (Circle or Rounded Rectangle).<br>Scale size dynamically (10% to 35% of the canvas width). |
| **🔊 Advanced Audio Mixing** | Mix system audio (device output) with microphone input in real-time.<br>Electron desktop app supports native WASAPI system-audio loopback.<br>Volume gain slider to boost or attenuate inputs. |
| **📊 Real-time Decibel Meter** | Highly responsive visual audio level meter with color-coded alerts (Green $\rightarrow$ Yellow $\rightarrow$ Red) to prevent silent recordings. |
| **✏️ Presentation Tools** | **Freehand Pen:** Annotate, write, and draw directly over screen elements during recording.<br>**Laser Pointer:** Glowing red dot cursor highlight that dynamically follows your mouse to guide viewers.<br>**Clear Canvas:** Wipe annotations instantly with a single click. |
| **📸 Still Frame Capture** | Capture and download full-resolution PNG screenshots mid-recording at the click of a button or hotkey. |
| **🕒 Local Session History** | Automatically lists past recordings in the current session with size, duration, mode tags, and auto-generated video frame thumbnails. Play, download, or discard directly. |
| **💾 Dual Format Export** | Save files in standard WebM (Opus/VP8) or MP4 (AAC/H264) container formats with quality presets ranging from 1 Mbps up to 8 Mbps (Ultra). |
| **⌨️ Global Custom Hotkeys** | Fully customizable keyboard shortcuts for starting, pausing, resuming, stopping, and taking screenshots. |

---

## 🚀 Execution & Deployment Options

This project is packaged to run in three different environments depending on your use case:

### 1. Electron Desktop App (Recommended for Windows)
The Electron desktop app provides the most robust experience because it allows **full system audio loopback capture (WASAPI)** on Windows without requiring you to share a specific Chrome tab or configure virtual cables.

#### Dev Setup & Running Locally:
1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. In the project root directory, run:
   ```bash
   npm install
   ```
3. Run the application in developer mode:
   ```bash
   npm start
   ```

#### Building the Installer / Portable Executable:
To build the production installer (`.exe`) and a portable desktop version:
```bash
npm run build
```
The compiled assets will be placed inside the `dist/` directory, including:
- `Screen Recorder Setup <version>.exe` (Interactive installer)
- `Screen-Recorder-portable.exe` (Single-file portable executable)

---

### 2. Chrome Extension (Manifest V3)
Run the recorder as a lightweight browser extension that floats on top of your work.

#### Installation Instructions:
1. Open Google Chrome or Microsoft Edge.
2. Navigate to the extensions page: `chrome://extensions/` (or `edge://extensions/`).
3. Toggle the **"Developer mode"** switch in the top-right corner to **ON**.
4. Click the **"Load unpacked"** button in the top-left.
5. Browse and select the `chrome-extension/` directory of this project.
6. Pin the **Screen Recorder** extension. Click its icon to launch a floating recorder window.

---

### 3. Standalone Web App
No installation required. Deploy the static directory to any static file hosting service.

- **Vercel deployment:** A pre-configured `vercel.json` is included. You can deploy instantly by running `vercel` in the project root.
- **Browser Limitations:** In standard web environments, system audio capture is only supported when sharing a **Chrome Tab** and checking the **"Share tab audio"** checkbox in the browser's native sharing dialog.

---

## 📖 Step-by-Step Usage Guide

### Screen + Camera (Picture-in-Picture) Recording
1. Launch the app and select **Screen + Camera** under *Recording Mode*.
2. Adjust your camera preferences:
   - Expand the **Video** settings accordion to choose a Quality Preset (Ultra/High/Medium/Low).
   - Set the camera position (e.g. *Bottom right*), shape (*Circle*), and size (*22%*).
3. Adjust audio settings:
   - Toggle **System audio** to record background app sounds.
   - Toggle **Microphone** to capture your voice.
4. Click **▶ Start**.
5. **Select Source:**
   - *In Electron:* A custom source selector modal will appear displaying all active windows and screens. Pick one.
   - *In Web Browser:* The native browser dialog will appear. Choose a tab or window. **CRITICAL:** Choose a tab or window *other than the recorder* to avoid a feedback mirror loop. If recording system audio, select a Chrome Tab and check **"Share tab audio"**.
6. **Countdown:** A 3-second visual countdown starts, giving you time to switch tabs.
7. **Annotate & Present:**
   - Return to the recorder screen or use keyboard shortcuts.
   - Select the ✏️ icon to draw on screen.
   - Select the 🔴 icon to turn on the laser pointer.
   - Click the 📸 icon to snap a PNG.
8. Click **⏹ Stop** (or press `Escape`).
9. **Preview & Save:** Watch the preview, edit the filename template, and click **Save as WebM** or **Save as MP4**.

---

## ⌨️ Default Keyboard Shortcuts

You can rebind these hotkeys to any key combination under the **Keyboard shortcuts** accordion in the sidebar:

| Action | Default Key | Description |
| :--- | :---: | :--- |
| **Start Recording** | `F9` | Begins the countdown and starts recording. |
| **Pause / Resume** | `Space` | Toggles pause state during a recording session. |
| **Stop Recording** | `Escape` | Stops recording and opens the preview download modal. |
| **Take Screenshot** | `S` | Saves a full-resolution PNG of the active canvas. |

---

## 🛠️ Technical Design & Audio Mixing

### Canvas Compositing Engine
To combine the screen share stream and the webcam feed into a single recorded video, the app uses a custom Canvas compositing pipe:
1. The screen stream is rendered to a hidden offscreen `<video>` element.
2. The webcam stream is rendered to another hidden offscreen `<video>` element.
3. A `requestAnimationFrame` loop (running at 30 FPS) draws the current frame of the screen video to the main `<canvas>` compositor.
4. The webcam frame is cropped (circular or rectangular border clip) and drawn as an overlay on top of the screen coordinates.
5. In order to make pen annotations persist, drawings are drawn to a separate buffer offscreen canvas, which is drawn onto the main canvas on each frame.
6. A video stream is captured from the canvas using `canvas.captureStream(30)`.

### WebAudio API Mixing
To combine multiple audio tracks without lag or echo:
```
[Screen Audio Track (System)] ───> [GainNode (Volume Control)] ──┐
                                                               ├──> [AnalyserNode] ──> [MediaStreamDestination]
[Microphone Audio Track (Voice)] ──────────────────────────────┘
```
- A `MediaStreamAudioDestinationNode` mixes all streams together into a single track.
- The mixed track is then combined with the composited canvas video track before being sent to the `MediaRecorder` API.
- This ensures system audio, mic, and the video composition are all synced perfectly in the final WebM/MP4 output.

---

## 📋 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
