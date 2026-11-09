'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const startBtn  = $('startBtn'),  pauseBtn  = $('pauseBtn');
const resumeBtn = $('resumeBtn'), stopBtn   = $('stopBtn'), ssBtn = $('ssBtn');
const statusEl  = $('status'),    timerEl   = $('timer');
const dot       = $('dot'),       mwrap     = $('mwrap'),  mbar = $('mbar');
const cdEl      = $('cd'),        cdNum     = $('cdNum'),  cdCancel = $('cdCancel');
const instrEl   = $('instr');
const view      = $('view'),      mainV     = $('mainV');
const canvas    = $('canvas'),    ctx       = canvas.getContext('2d');
const dbar      = $('dbar');
const pm        = $('pm'),        pvid      = $('pvid');
const dlWebmBtn = $('dlWebmBtn'), dlMp4Btn  = $('dlMp4Btn'), discBtn = $('discBtn');
const gainRange = $('gainRange'), gainValEl = $('gainVal');
const filenameTemplate = $('filenameTemplate');
const saveFilename     = $('saveFilename');
const histHead  = $('histHead'),  histBody  = $('histBody');
const histList  = $('histList'),  histEmpty = $('histEmpty'), histCount = $('histCount');

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEMES = ['dark', 'light', 'light-panda'];
let theme = localStorage.getItem('sr-ext-theme') || 'dark';
if (!THEMES.includes(theme)) theme = 'dark';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  theme = t;
  localStorage.setItem('sr-ext-theme', t);
  const btn   = $('themeBtn');
  const thumb = btn.querySelector('.theme-toggle-thumb');
  const isDarkOrPanda = t === 'dark' || t === 'light-panda';
  btn.setAttribute('aria-checked', isDarkOrPanda ? 'true' : 'false');
  thumb.setAttribute('data-checked', isDarkOrPanda ? 'true' : 'false');
}
applyTheme(theme);
$('themeBtn').addEventListener('click', () => {
  applyTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
});

// ── Settings accordion ────────────────────────────────────────────────────────
function toggleSettings(key) {
  const head = $(key + 'Head'), body = $(key + 'Body');
  head.classList.toggle('open');
  body.classList.toggle('open');
}

// ── History toggle ────────────────────────────────────────────────────────────
function toggleHistory() {
  histHead.classList.toggle('open');
  histBody.classList.toggle('open');
}

// ── Cam size slider ───────────────────────────────────────────────────────────
$('csz').addEventListener('input', () => {
  $('cszVal').textContent = $('csz').value + '%';
});

// ── Gain slider ───────────────────────────────────────────────────────────────
gainRange.addEventListener('input', () => {
  gainValEl.textContent = gainRange.value + '%';
  if (gainNode) gainNode.gain.value = gainRange.value / 100;
});

// ── Mode UI ───────────────────────────────────────────────────────────────────
const INSTRS = {
  screen: `<b>Screen only:</b><br>
    1. Click <b>▶ Start</b> → Chrome share picker opens<br>
    2. Choose <b>"Chrome Tab"</b> → pick the tab you want to record<br>
    3. Allow mic → countdown → recording starts<br>
    4. Switch to that tab and work — this window keeps recording<br>
    5. Come back here → <b>⏹ Stop</b> → preview → download`,
  camera: `<b>Camera only:</b><br>
    1. Click <b>▶ Start</b> → allow camera access<br>
    2. 3-second countdown → recording begins<br>
    3. Click <b>⏹ Stop</b> when done → preview → download`,
  both: `<b>Screen + Camera:</b><br>
    1. Click <b>▶ Start</b> → share picker opens<br>
    2. Choose <b>"Chrome Tab"</b> → pick <b>a different tab</b><br>
    <span class="warn">⚠ Don't pick this recorder window — mirror loop!</span><br>
    3. Allow camera &amp; mic → countdown → recording starts<br>
    4. Switch to your tab and work<br>
    5. Return here → <b>⏹ Stop</b> → preview → download`
};

function getMode() { return document.querySelector('input[name="mode"]:checked').value; }
function setStatus(s) { statusEl.textContent = s; }

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const m = card.querySelector('input').value;
    instrEl.innerHTML = INSTRS[m] || '';
    instrEl.style.display = INSTRS[m] ? 'block' : 'none';
    const isBoth = m === 'both';
    $('opos').style.display  = isBoth ? 'block' : 'none';
    $('oshp').style.display  = isBoth ? 'block' : 'none';
    $('osz').style.display   = isBoth ? 'block' : 'none';
    $('sysAudioField').style.display = m === 'camera' ? 'none' : '';
  });
});
instrEl.innerHTML = INSTRS.screen;
instrEl.style.display = 'block';

// ── State ─────────────────────────────────────────────────────────────────────
let recorder     = null, chunks = [];
let savedBlob    = null, blobWebm = null, blobMp4 = null;
let screenStream = null, camStream = null;
let audioCtx     = null, gainNode = null, analyser = null;
let audioSourceStreams = [];
let drawVid = null, camVid = null, drawInterval = null, vfcId = null;
let drawingCanvas = null, drawingCtx = null;
let timerIntvl   = null, elapsedSec = 0;
let meterRaf     = null;
let isRecording  = false;
let currentMode  = 'screen';
let countdownCancelled = false;

// Drawing state
let drawMode = null, drawColor = '#ff6584';
let isDrawing = false, px = 0, py = 0;
let mouseX = 0, mouseY = 0, mouseOverCanvas = false;

// History
let history    = [];
let nextHistId = 0;

// ── Timer ─────────────────────────────────────────────────────────────────────
function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  const hrs  = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
function startTimer() {
  elapsedSec = 0; timerEl.textContent = '00:00';
  timerEl.style.display = 'block'; dot.style.display = 'block';
  timerIntvl = setInterval(() => { elapsedSec++; timerEl.textContent = fmtTime(elapsedSec); }, 1000);
}
function stopTimer() {
  clearInterval(timerIntvl); timerIntvl = null;
  timerEl.style.display = 'none'; dot.style.display = 'none';
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function runCountdown(n) {
  return new Promise((resolve, reject) => {
    countdownCancelled = false;
    cdEl.style.display = 'flex'; cdNum.textContent = n;
    const cancel = () => {
      clearInterval(t); cdEl.style.display = 'none';
      countdownCancelled = true; reject(new Error('Cancelled'));
    };
    cdCancel.addEventListener('click', cancel, { once: true });
    const t = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(t);
        cdCancel.removeEventListener('click', cancel);
        cdEl.style.display = 'none'; resolve();
      } else {
        cdNum.textContent = n;
      }
    }, 1000);
  });
}
cdCancel.addEventListener('click', () => { /* handled inside runCountdown */ });

// ── Audio mixer ───────────────────────────────────────────────────────────────
function mixAudio(...streams) {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const dest = audioCtx.createMediaStreamDestination();
  analyser   = audioCtx.createAnalyser(); analyser.fftSize = 256;
  gainNode   = audioCtx.createGain(); gainNode.gain.value = gainRange.value / 100;

  streams.forEach(s => {
    const tracks = s?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const only = new MediaStream([tracks[0]]);
    audioSourceStreams.push(only);
    const src = audioCtx.createMediaStreamSource(only);
    src.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(dest);
  });
  return dest.stream.getAudioTracks()[0] || null;
}

function startMeter() {
  const data = new Uint8Array(analyser.frequencyBinCount);
  mwrap.style.display = 'flex';
  const tick = () => {
    if (!analyser) return;
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    mbar.style.width = Math.min(100, avg * 2) + '%';
    meterRaf = requestAnimationFrame(tick);
  };
  meterRaf = requestAnimationFrame(tick);
}
function stopMeter() {
  if (meterRaf) cancelAnimationFrame(meterRaf);
  meterRaf = null; mwrap.style.display = 'none'; mbar.style.width = '0%';
}

// ── Filename helpers ──────────────────────────────────────────────────────────
function expandFilename(template, mode) {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const safe = (template || 'recording-{date}-{time}').slice(0, 128);
  return safe
    .replace(/\{date\}/g, date)
    .replace(/\{time\}/g, time)
    .replace(/\{mode\}/g, mode)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[^\w\-. ]/g, '');
}
function fmtSize(bytes) { return (bytes / 1024 / 1024).toFixed(1) + ' MB'; }

// ── WebM duration patch ───────────────────────────────────────────────────────
async function fixWebmDuration(rawBlob, durationMs) {
  if (!rawBlob || durationMs <= 0) return rawBlob;
  try {
    const buffer = await rawBlob.arrayBuffer();
    const view   = new DataView(buffer);
    let infoPos  = -1;
    for (let i = 0; i < view.byteLength - 4; i++) {
      if (view.getUint32(i) === 0x1549A966) { infoPos = i; break; }
    }
    if (infoPos === -1) return rawBlob;
    let durPos = -1;
    for (let i = infoPos; i < Math.min(infoPos + 500, view.byteLength - 10); i++) {
      if (view.getUint16(i) === 0x4489) { durPos = i; break; }
    }
    if (durPos !== -1) {
      new DataView(buffer, durPos + 3, 8).setFloat64(0, durationMs, false);
      return new Blob([buffer], { type: rawBlob.type });
    }
    // Insert duration element
    const insertPos = infoPos + 5;
    const durBytes  = new Uint8Array(11);
    durBytes[0] = 0x44; durBytes[1] = 0x89; durBytes[2] = 0x88;
    new DataView(durBytes.buffer, 3, 8).setFloat64(0, durationMs, false);
    const newBuf = new Uint8Array(view.byteLength + 11);
    newBuf.set(new Uint8Array(buffer, 0, insertPos), 0);
    newBuf.set(durBytes, insertPos);
    newBuf.set(new Uint8Array(buffer, insertPos), insertPos + 11);
    return new Blob([newBuf.buffer], { type: rawBlob.type });
  } catch (_) { return rawBlob; }
}

// ── Video helpers ─────────────────────────────────────────────────────────────
function waitForVideo(v) {
  return new Promise(res => {
    const c = () => (v.videoWidth > 0 && v.videoHeight > 0) ? res() : setTimeout(c, 50);
    c();
  });
}
async function makeVid(stream) {
  const v = document.createElement('video');
  v.srcObject = stream; v.muted = true; v.playsInline = true;
  await v.play(); await waitForVideo(v); return v;
}

// ── Canvas compositing (Screen + Camera) ──────────────────────────────────────
function camRect(cw, ch) {
  const pct = parseInt($('csz').value) / 100;
  const w   = Math.round(canvas.width * pct);
  const h   = Math.round(w * (ch / cw));
  const pos = $('pos').value, pad = 14;
  const x   = pos.includes('r') ? canvas.width  - w - pad : pad;
  const y   = pos.includes('b') ? canvas.height - h - pad : pad;
  return { x, y, w, h };
}
function drawCamOverlay(cv) {
  const { x, y, w, h } = camRect(cv.videoWidth, cv.videoHeight);
  const shape = $('shp').value;
  ctx.save();
  ctx.beginPath();
  if (shape === 'round') { const r = Math.min(w, h) / 2; ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2); }
  else ctx.roundRect(x, y, w, h, 8);
  ctx.clip();
  ctx.drawImage(cv, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
  ctx.beginPath();
  if (shape === 'round') { const r = Math.min(w, h) / 2; ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2); }
  else ctx.roundRect(x, y, w, h, 8);
  ctx.stroke();
}

function startComposite(sv, cv) {
  drawVid = sv;
  const render = () => {
    if (!drawVid) return;
    try {
      ctx.drawImage(sv, 0, 0, canvas.width, canvas.height);
      drawCamOverlay(cv);
      if (drawingCanvas) ctx.drawImage(drawingCanvas, 0, 0);
      if (drawMode === 'laser' && mouseOverCanvas) {
        ctx.save();
        ctx.shadowBlur = 10; ctx.shadowColor = '#ff3b30';
        ctx.fillStyle  = '#ff3b30';
        ctx.beginPath(); ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } catch (_) {}
  };
  const frame = () => {
    if (!drawVid) return;
    render();
    if ('requestVideoFrameCallback' in sv) vfcId = sv.requestVideoFrameCallback(frame);
  };
  if ('requestVideoFrameCallback' in sv) vfcId = sv.requestVideoFrameCallback(frame);
  if (!drawInterval) drawInterval = setInterval(render, 1000 / 30);
}

// ── Screenshot ────────────────────────────────────────────────────────────────
function screenshot() {
  const c2 = document.createElement('canvas');
  if (canvas.style.display !== 'none') {
    c2.width = canvas.width; c2.height = canvas.height;
    c2.getContext('2d').drawImage(canvas, 0, 0);
  } else {
    c2.width = mainV.videoWidth; c2.height = mainV.videoHeight;
    c2.getContext('2d').drawImage(mainV, 0, 0);
  }
  c2.toBlob(blob => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'screenshot-' + Date.now() + '.png'
    });
    a.click(); URL.revokeObjectURL(a.href);
  }, 'image/png');
}

// ── Drawing tools ─────────────────────────────────────────────────────────────
canvas.addEventListener('mouseenter', () => { mouseOverCanvas = true; });
canvas.addEventListener('mouseleave', () => { mouseOverCanvas = false; isDrawing = false; });
canvas.addEventListener('mousedown', e => {
  if (!drawMode) return; isDrawing = true;
  const r = canvas.getBoundingClientRect(), sx = canvas.width / r.width, sy = canvas.height / r.height;
  px = (e.clientX - r.left) * sx; py = (e.clientY - r.top) * sy;
  mouseX = px; mouseY = py;
  if (drawMode === 'pen' && drawingCtx) {
    drawingCtx.save(); drawingCtx.fillStyle = drawColor;
    drawingCtx.beginPath(); drawingCtx.arc(px, py, 2, 0, Math.PI * 2); drawingCtx.fill(); drawingCtx.restore();
  }
});
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect(), sx = canvas.width / r.width, sy = canvas.height / r.height;
  mouseX = (e.clientX - r.left) * sx; mouseY = (e.clientY - r.top) * sy;
  if (!isDrawing || drawMode !== 'pen' || !drawingCtx) return;
  drawingCtx.save(); drawingCtx.strokeStyle = drawColor; drawingCtx.lineWidth = 4; drawingCtx.lineCap = 'round';
  drawingCtx.beginPath(); drawingCtx.moveTo(px, py); drawingCtx.lineTo(mouseX, mouseY); drawingCtx.stroke(); drawingCtx.restore();
  px = mouseX; py = mouseY;
});
canvas.addEventListener('mouseup', () => { isDrawing = false; });

$('laserBtn').addEventListener('click', () => {
  drawMode = drawMode === 'laser' ? null : 'laser';
  $('laserBtn').classList.toggle('on', drawMode === 'laser');
  $('penBtn').classList.remove('on');
});
$('penBtn').addEventListener('click', () => {
  drawMode = drawMode === 'pen' ? null : 'pen';
  $('penBtn').classList.toggle('on', drawMode === 'pen');
  $('laserBtn').classList.remove('on');
});
$('clearBtn').addEventListener('click', () => {
  if (drawingCtx) drawingCtx.clearRect(0, 0, canvas.width, canvas.height);
});
$('cpick').addEventListener('click', () => $('ci').click());
$('ci').addEventListener('input', e => { drawColor = e.target.value; $('cpick').style.background = drawColor; });

// ── History panel ─────────────────────────────────────────────────────────────
function addHistory(blob, mode, durationSec) {
  const id  = nextHistId++;
  const name = expandFilename(filenameTemplate.value, mode);
  const dur  = fmtTime(durationSec);
  const size = fmtSize(blob.size);

  // Thumbnail from canvas or black frame
  let thumbSrc = '';
  try {
    if (canvas.style.display !== 'none' && canvas.width > 0) {
      thumbSrc = canvas.toDataURL('image/jpeg', 0.5);
    } else if (mainV.videoWidth > 0) {
      const tc = document.createElement('canvas');
      tc.width = mainV.videoWidth; tc.height = mainV.videoHeight;
      tc.getContext('2d').drawImage(mainV, 0, 0);
      thumbSrc = tc.toDataURL('image/jpeg', 0.5);
    }
  } catch (_) {}

  history.unshift({ id, blob, name, dur, size, thumbSrc, mode });
  renderHistory();
}

function renderHistory() {
  histCount.textContent = history.length;
  if (!history.length) {
    histEmpty.style.display = 'block';
    histList.innerHTML = '';
    return;
  }
  histEmpty.style.display = 'none';
  histList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-thumb">
        ${item.thumbSrc ? `<img src="${item.thumbSrc}" alt="thumb"/>` : ''}
      </div>
      <div class="history-info">
        <div class="history-name" title="${item.name}.webm">${item.name}.webm</div>
        <div class="history-meta">${item.dur} · ${item.size}</div>
      </div>
      <div class="history-actions">
        <button class="btn btn-ghost btn-sm" onclick="rePreview(${item.id})" title="Preview">▶</button>
        <button class="btn btn-primary btn-sm" onclick="reDl(${item.id})" title="Download">⬇</button>
      </div>
    </div>
  `).join('');
}

window.rePreview = function(id) {
  const item = history.find(h => h.id === id);
  if (!item) return;
  savedBlob = item.blob; blobWebm = item.blob; blobMp4 = null;
  openPreview(item.blob, item.mode);
};
window.reDl = function(id) {
  const item = history.find(h => h.id === id);
  if (!item) return;
  triggerDownload(item.blob, item.name + '.webm');
};

// ── Save-as helper ────────────────────────────────────────────────────────────
async function saveAs(blob, suggestedName) {
  if (window.showSaveFilePicker) {
    const ext = suggestedName.split('.').pop().toLowerCase();
    const mimeMap = { webm: 'video/webm', mp4: 'video/mp4' };
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: ext.toUpperCase() + ' video', accept: { [mimeMap[ext] || 'video/webm']: ['.' + ext] } }]
      });
      const ws = await fh.createWritable();
      await ws.write(blob); await ws.close(); return;
    } catch (e) { if (e.name === 'AbortError') return; }
  }
  triggerDownload(blob, suggestedName);
}

function triggerDownload(blob, name) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: name
  });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function openPreview(blob, mode) {
  pvid.src = URL.createObjectURL(blob);
  $('fmtWebm').style.display = 'inline';
  $('fmtMp4').style.display  = 'none';
  $('recSize').textContent   = fmtSize(blob.size);
  $('mp4note').style.display = 'none';
  // Pre-fill filename
  const baseName = expandFilename(filenameTemplate.value, mode);
  saveFilename.value = baseName;
  pm.style.display = 'flex';
}

function closePreview() {
  pm.style.display = 'none';
  URL.revokeObjectURL(pvid.src); pvid.src = '';
}

dlWebmBtn.addEventListener('click', async () => {
  const blob = blobWebm || savedBlob;
  if (!blob) return;
  const name = (saveFilename.value || expandFilename(filenameTemplate.value, currentMode)).replace(/\.(webm|mp4)$/i, '');
  await saveAs(blob, name + '.webm');
  closePreview();
});

dlMp4Btn.addEventListener('click', async () => {
  // Chrome extension context — MP4 container not natively available
  // Offer WebM renamed as .mp4 as a fallback (plays fine in most players)
  const blob = blobWebm || savedBlob;
  if (!blob) return;
  const name = (saveFilename.value || expandFilename(filenameTemplate.value, currentMode)).replace(/\.(webm|mp4)$/i, '');
  // Try native MP4; show note if only WebM available
  $('mp4note').style.display = 'block';
  await saveAs(new Blob([blob], { type: 'video/mp4' }), name + '.mp4');
  closePreview();
});

discBtn.addEventListener('click', () => {
  savedBlob = blobWebm = blobMp4 = null;
  closePreview();
});

// ── Main recording flow ───────────────────────────────────────────────────────
async function start() {
  // Init AudioContext on user gesture
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  } catch (e) { console.error('[AudioContext]', e); }

  chunks = []; savedBlob = blobWebm = blobMp4 = null;
  screenStream = camStream = null; drawVid = camVid = null; vfcId = null;
  audioSourceStreams = [];

  const m          = getMode();
  currentMode      = m;
  const bitrate    = parseInt($('q').value);
  const enableSys  = $('sysAudioToggle').checked;
  const enableMic  = $('micToggle').checked;

  try {
    let vTrack, aTrack;

    if (m === 'screen') {
      setStatus('Waiting for screen share…');
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: enableSys });
      let micStream = null;
      if (enableMic) {
        try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); } catch (_) {}
      }
      vTrack = screenStream.getVideoTracks()[0];
      aTrack = analyser ? null : (micStream
        ? mixAudio(screenStream, micStream)
        : enableSys ? mixAudio(screenStream) : null);
      if (!analyser && micStream)   aTrack = mixAudio(screenStream, micStream);
      else if (!analyser && enableSys) aTrack = mixAudio(screenStream);
      mainV.srcObject = screenStream; mainV.style.display = 'block';
      canvas.style.display = 'none';
      view.style.display = 'block'; dbar.style.display = 'none';

    } else if (m === 'camera') {
      setStatus('Waiting for camera…');
      camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: enableMic });
      vTrack = camStream.getVideoTracks()[0];
      aTrack = enableMic ? mixAudio(camStream) : null;
      mainV.srcObject = camStream; mainV.style.display = 'block';
      canvas.style.display = 'none';
      view.style.display = 'block'; dbar.style.display = 'none';

    } else {
      // Screen + Camera composite
      setStatus('Pick a tab to record…');
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: enableSys });
      setStatus('Allow camera & mic…');
      camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: enableMic });
      setStatus('Building composite…');

      const [sv, cv] = await Promise.all([makeVid(screenStream), makeVid(camStream)]);
      camVid = cv;
      canvas.width  = sv.videoWidth;
      canvas.height = sv.videoHeight;

      drawingCanvas = document.createElement('canvas');
      drawingCanvas.width  = canvas.width;
      drawingCanvas.height = canvas.height;
      drawingCtx = drawingCanvas.getContext('2d');

      startComposite(sv, cv);
      await new Promise(r => setTimeout(r, 300));

      canvas.style.display = 'block'; mainV.style.display = 'none';
      view.style.display = 'block'; dbar.style.display = 'flex';
      canvas.style.cursor = 'crosshair';

      vTrack = canvas.captureStream(30).getVideoTracks()[0];
      const streamsToMix = [enableSys ? screenStream : null, enableMic ? camStream : null].filter(Boolean);
      aTrack = streamsToMix.length ? mixAudio(...streamsToMix) : null;
    }

    // Auto-stop when screen share ends
    if (vTrack) {
      vTrack.onended = () => {
        if (recorder && recorder.state !== 'inactive') stop();
      };
    }

    if (analyser) startMeter();

    const tracks = [vTrack, aTrack].filter(Boolean);
    const recStream = new MediaStream(tracks);

    await runCountdown(3);

    recorder = new MediaRecorder(recStream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: bitrate
    });
    recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.onstop = onStop;
    recorder.onerror = () => { if (recorder && recorder.state !== 'inactive') stop(); };
    recorder.start(1000);

    isRecording = true;
    startTimer();
    setStatus('Recording… switch to your tab freely');
    startBtn.disabled = true; pauseBtn.disabled = false;
    stopBtn.disabled = false; ssBtn.disabled = false;
    document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = true);

  } catch (err) {
    if (!countdownCancelled) setStatus('Error: ' + err.message);
    cleanup();
  }
}

function pause() {
  if (recorder?.state === 'recording') {
    recorder.pause(); setStatus('Paused');
    clearInterval(timerIntvl); timerIntvl = null;
    pauseBtn.disabled = true; resumeBtn.disabled = false;
    dot.style.animationPlayState = 'paused';
  }
}
function resume() {
  if (recorder?.state === 'paused') {
    recorder.resume(); setStatus('Recording…');
    timerIntvl = setInterval(() => { elapsedSec++; timerEl.textContent = fmtTime(elapsedSec); }, 1000);
    resumeBtn.disabled = true; pauseBtn.disabled = false;
    dot.style.animationPlayState = 'running';
  }
}
function stop() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

async function onStop() {
  const dur = elapsedSec;
  isRecording = false;
  stopTimer(); stopMeter();

  const rawBlob = new Blob(chunks, { type: 'video/webm' });
  blobWebm = await fixWebmDuration(rawBlob, (dur || 1) * 1000);
  savedBlob = blobWebm;

  addHistory(blobWebm, currentMode, dur);
  openPreview(blobWebm, currentMode);
  cleanup(false);
}

function cleanup(resetUI = true) {
  if (vfcId !== null && drawVid && 'cancelVideoFrameCallback' in drawVid) drawVid.cancelVideoFrameCallback(vfcId);
  if (drawInterval !== null) { clearInterval(drawInterval); drawInterval = null; }
  vfcId = null; drawVid = null; camVid = null;
  if (drawingCtx) drawingCtx.clearRect(0, 0, canvas.width, canvas.height);
  drawingCanvas = null; drawingCtx = null;
  mouseX = 0; mouseY = 0; mouseOverCanvas = false; drawMode = null;
  $('laserBtn').classList.remove('on'); $('penBtn').classList.remove('on');

  stopTimer(); stopMeter();
  if (audioCtx) { audioCtx.close(); audioCtx = null; gainNode = null; analyser = null; }
  audioSourceStreams = [];
  [screenStream, camStream].forEach(s => s?.getTracks().forEach(t => t.stop()));
  screenStream = camStream = null;
  mainV.srcObject = null;

  if (resetUI) {
    view.style.display = 'none'; dbar.style.display = 'none';
  }
  startBtn.disabled = false; pauseBtn.disabled = true;
  resumeBtn.disabled = true; stopBtn.disabled = true; ssBtn.disabled = true;
  document.querySelectorAll('input[name="mode"]').forEach(r => r.disabled = false);
  setStatus('Ready');
}

// ── Button wiring ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click',  start);
pauseBtn.addEventListener('click',  pause);
resumeBtn.addEventListener('click', resume);
stopBtn.addEventListener('click',   stop);
ssBtn.addEventListener('click',     screenshot);

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (e.code === 'Space' && !startBtn.disabled) {
    e.preventDefault();
    recorder?.state === 'paused' ? resume() : pause();
  }
  if (e.code === 'Escape') {
    if (cdEl.style.display !== 'none') { cdCancel.click(); return; }
    if (!stopBtn.disabled) stop();
  }
  if (e.code === 'KeyS' && !ssBtn.disabled) screenshot();
});
