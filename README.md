# Screen Recorder

A client-side screen recording application with real-time facecam overlays, advanced audio mixing, canvas annotation tools, and instant local downloads. All recording and rendering runs entirely locally — no cloud services, no uploads, no accounts.

---

## Features

| Feature | Description |
| :--- | :--- |
| **Multi-Mode Recording** | Record screen only, camera only, or screen with camera overlay. |
| **Configurable Facecam** | Position, shape (circle/rectangle), and size (10–35% of canvas) are fully adjustable. |
| **Advanced Audio Mixing** | Mix system audio (WASAPI loopback on Windows) with microphone input. Includes gain control and real-time decibel meter. |
| **Presentation Tools** | Freehand pen, laser pointer, and canvas clear — all composited into the final recording. |
| **Screenshot Capture** | Full-resolution PNG screenshots during recording via hotkey. |
| **Dual Format Export** | WebM (Opus/VP8) or MP4 (AAC/H264) with quality presets from 1 Mbps to 8 Mbps. |
| **Customizable Hotkeys** | Remappable keyboard shortcuts for all recording actions. |
| **Session History** | Browse past recordings with thumbnails, size, duration, and mode tags. |

---

## Deployment

### Electron Desktop App (Windows)

The Electron build provides full WASAPI system audio loopback without virtual audio cables or tab sharing.

```bash
npm install
npm start          # Run in development mode
npm run build      # Build portable zip to dist/
```

The build output is a zip archive in the `dist/` directory containing the unpacked application — no installer required.

### Chrome Extension

Load the `chrome-extension/` directory as an unpacked extension in Chrome or Edge:

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `chrome-extension/` directory

### Web App

Deploy the project root as a static site. A `vercel.json` is included for one-command Vercel deployment.

> **Note:** System audio capture in browsers is limited to Chrome Tab sharing with the "Share tab audio" option enabled.

---

## Keyboard Shortcuts

| Action | Default Key |
| :--- | :---: |
| Start Recording | `F9` |
| Pause / Resume | `Space` |
| Stop Recording | `Escape` |
| Take Screenshot | `S` |

All shortcuts are rebindable through the sidebar settings.

---

## Architecture

### Canvas Compositing

Screen and webcam streams are rendered to offscreen video elements. A `requestAnimationFrame` loop at 30 FPS composites them onto a canvas — screen as the base layer, webcam as a positioned overlay. Pen annotations are maintained on a separate buffer canvas and drawn each frame. The final output is captured via `canvas.captureStream(30)`.

### Audio Pipeline

```
System Audio (WASAPI) ──> GainNode ──┐
                                      ├──> AnalyserNode ──> MediaStreamDestination
Microphone ─────────────────────────┘
```

All audio tracks are mixed through a `MediaStreamAudioDestinationNode` and combined with the composited video for synchronized WebM/MP4 output via the `MediaRecorder` API.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
