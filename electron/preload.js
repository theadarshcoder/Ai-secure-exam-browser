const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    getSecretKey: async () => {
        const fingerprint = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            width: window.screen.width,
            height: window.screen.height
        };
        return await ipcRenderer.invoke('get-secure-key', fingerprint);
    },
    getFingerprint: () => ({
        platform: navigator.platform,
        width: window.screen.width,
        height: window.screen.height
    }),
    // 🔗 Magic Deep Link: Listen for auth tokens from main process
    onAuthToken: (callback) => {
        ipcRenderer.on('deep-link-auth', (event, token) => callback(token));
    }
});

// 🔒 Client-side hardening (Paste prevention)
window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('keydown', (e) => {
        // Block Ctrl+V (Paste)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            console.warn('🔒 Paste is disabled in secure mode.');
        }
        
        // Block Ctrl+Shift+I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
        }

        // Block F12
        if (e.key === 'F12') {
            e.preventDefault();
        }
    });
});
