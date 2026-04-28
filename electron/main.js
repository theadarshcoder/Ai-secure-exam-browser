const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');

// 🛡️ SECURITY CONFIG
const ELECTRON_SECRET = 'VisionSecure_Alpha2026_Enterprise_X'; // Match with Backend .env
const APP_URL = 'https://vision-live.pages.dev/'; // 🚀 Production Frontend URL

// 🔒 Register Custom Protocol for Auto-Launch
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('vision-secure', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('vision-secure');
}

let mainWindow;
let pendingDeepLinkToken = null;

// 🔗 Extract token from deep link URL: vision-secure://launch?token=XYZ
function extractTokenFromUrl(url) {
    try {
        if (!url || !url.startsWith('vision-secure://')) return null;
        const urlObj = new URL(url.replace('vision-secure://', 'http://dummy/'));
        return urlObj.searchParams.get('token') || null;
    } catch (e) {
        console.warn('🔗 Deep link parse error:', e.message);
        return null;
    }
}

// 🔗 Check launch args for deep link token (first launch)
function checkArgsForToken(args) {
    const deepLinkArg = args.find(arg => arg.startsWith('vision-secure://'));
    if (deepLinkArg) {
        return extractTokenFromUrl(deepLinkArg);
    }
    return null;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // 🔒 1. Disable Menu
    mainWindow.setMenu(null);

    // 🔒 2. Disable DevTools
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });

    // 🔒 3. Content Protection (Disable screenshots/screen recording)
    mainWindow.setContentProtection(true);

    // 🔒 4. Zoom Lock
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.setZoomFactor(1);

        // 🔗 Send pending deep link token to renderer after page loads
        if (pendingDeepLinkToken) {
            console.log('🔗 Sending deep link token to renderer...');
            mainWindow.webContents.send('deep-link-auth', pendingDeepLinkToken);
            pendingDeepLinkToken = null;
        }
    });

    // 🔒 5. Block New Windows & External Links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // 🔒 6. Navigation Lock
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(APP_URL)) {
            event.preventDefault();
        }
    });

    mainWindow.loadURL(APP_URL);
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

// 🔒 Prevent multiple instances & handle deep links on second-instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        // 🔗 Extract token from the second instance's command line args
        const token = checkArgsForToken(commandLine);
        if (token && mainWindow) {
            console.log('🔗 Second instance deep link detected, forwarding token...');
            mainWindow.webContents.send('deep-link-auth', token);
        }

        // Focus existing window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        // 🔗 Check if app was launched via deep link (first time)
        const token = checkArgsForToken(process.argv);
        if (token) {
            pendingDeepLinkToken = token;
            console.log('🔗 App launched via deep link, token queued for delivery.');
        }

        createWindow();
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 🔗 Handle protocol on macOS (open-url event)
app.on('open-url', (event, url) => {
    event.preventDefault();
    const token = extractTokenFromUrl(url);
    if (token) {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('deep-link-auth', token);
        } else {
            pendingDeepLinkToken = token;
        }
    }
});
