const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    maxTabSwitches: { type: Number, default: 5 },
    maxViolations: { type: Number, default: 5 }, // New: Max total cheating flags allowed
    backgroundLimitSeconds: { type: Number, default: 10 }, // New: Max duration allowed outside the tab
    forceFullscreen: { type: Boolean, default: true },
    allowLateSubmissions: { type: Boolean, default: false },
    enableWebcam: { type: Boolean, default: true },
    disableCopyPaste: { type: Boolean, default: true },
    requireIDVerification: { type: Boolean, default: true },
    exitPassword: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
