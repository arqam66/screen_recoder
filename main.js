const { app, BrowserWindow, Menu, shell, desktopCapturer, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('enable-features', 'WebRTC-H264WithOpenH264FFmpeg');
// Required for WASAPI system-audio loopback capture on Windows 10/11
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('auto-accept-camera-and-microphone-capture');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1150,
    height: 860,
    minWidth: 720,
    minHeight: 620,
    title: 'Screen Recorder',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#080b12',
    show: false,
  });

  // Grant all required media permissions automatically
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'display-capture', 'mediaKeySystem', 'microphone', 'camera', 'audioCapture'];
    return allowed.includes(permission);
  });

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'display-capture', 'mediaKeySystem', 'geolocation', 'microphone', 'camera', 'audioCapture'];
    callback(allowed.includes(permission));
  });

  // Handle getDisplayMedia
  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    if (request.videoRequested) {
      // We will handle the actual source selection in the renderer via IPC
      // and then call getDisplayMedia with the specific sourceId if needed.
      // However, for now, we'll allow the request and the renderer will
      // provide the sourceId in the constraints.
      // But Electron's getDisplayMedia doesn't always show the picker.
      // If we want to show our own picker, we need to pass the source here.
    }
    callback({ audio: 'loopback' }); // Default to allowing loopback
  });

  ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: { width: 150, height: 150 } });
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  ipcMain.handle('save-file', async (event, { buffer, suggestedName }) => {
    const { filePath } = await dialog.showSaveDialog(win, {
      defaultPath: suggestedName,
      filters: [
        { name: 'Videos', extensions: ['webm', 'mp4'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, buffer);
      return true;
    }
    return false;
  });

  win.loadFile('index.html');

  // Show window once fully loaded (no white flash)
  win.once('ready-to-show', () => win.show());

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Remove default menu bar
Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
