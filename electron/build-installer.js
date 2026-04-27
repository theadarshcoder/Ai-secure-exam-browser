const electronInstaller = require('electron-winstaller');
const path = require('path');

async function build() {
    console.log("🛠️ Starting Installer Generation...");
    try {
        await electronInstaller.createWindowsInstaller({
            appDirectory: path.join(__dirname, 'dist/VISION Secure Browser-win32-x64'),
            outputDirectory: path.join(__dirname, 'dist/installer'),
            authors: 'Vision Team',
            exe: 'VISION Secure Browser.exe',
            setupExe: 'VISION_Secure_Setup.exe',
            noMsi: true,
        });
        console.log("✅ SUCCESS! Your Single Installer is ready in electron/dist/installer/VISION_Secure_Setup.exe");
    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

build();
