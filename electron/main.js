const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');

// 🛡️ SECURITY CONFIG
const ELECTRON_SECRET = 'VisionSecure_Alpha2026_Enterprise_X'; // Match with Backend .env
const APP_URL = 'https://vision-live.pages.dev/'; // 🚀 Production Frontend URL

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,
        kiosk: true, // Optional: strictly locks the app
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // 🔒 1. Disable Menu
    win.setMenu(null);

    // 🔒 2. Disable DevTools
    win.webContents.on('devtools-opened', () => {
        win.webContents.closeDevTools();
    });

    // 🔒 3. Content Protection (Disable screenshots/screen recording)
    win.setContentProtection(true);

    // 🔒 4. Zoom Lock
    win.webContents.setVisualZoomLevelLimits(1, 1);
    win.webContents.on('did-finish-load', () => {
        win.webContents.setZoomFactor(1);
    });

    // 🔒 5. Block New Windows & External Links
    win.webContents.setWindowOpenHandler(({ url }) => {
        // Open external links in system browser, deny in-app
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // 🔒 6. Navigation Lock
    win.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(APP_URL)) {
            event.preventDefault();
        }
    });

    // 🔒 7. Clipboard / Input Hardening (handled in preload for finer control)

    win.loadURL(APP_URL);
}

// 🔐 Secure Key Generation (Dynamic HMAC V4)
ipcMain.handle('get-secure-key', (event, fingerprint) => {
    const { userAgent, platform, width, height } = fingerprint;
    const data = `${userAgent}|${platform}|${width}|${height}`;
    return crypto
        .createHmac('sha256', ELECTRON_SECRET)
        .update(data)
        .digest('hex');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 🔒 Extra: Prevent multiple instances
const additionalData = { myKey: 'vision-secure' };
const gotTheLock = app.requestSingleInstanceLock(additionalData);

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
        // Someone tried to run a second instance, focus our window.
        const allWindows = BrowserWindow.getAllWindows();
        if (allWindows.length) {
            if (allWindows[0].isMinimized()) allWindows[0].restore();
            allWindows[0].focus();
        }
    });
}
