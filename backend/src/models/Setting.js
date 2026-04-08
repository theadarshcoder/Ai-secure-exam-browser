const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    maxTabSwitches: { type: Number, default: 5 },
    forceFullscreen: { type: Boolean, default: true },
    allowLateSubmissions: { type: Boolean, default: false },
    enableWebcam: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
