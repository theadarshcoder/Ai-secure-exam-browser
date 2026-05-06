const mongoose = require('mongoose');

const institutionSettingsSchema = new mongoose.Schema({
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, unique: true },
    maxTabSwitches: { type: Number, default: 5 },
    maxViolations: { type: Number, default: 5 },
    backgroundLimitSeconds: { type: Number, default: 10 },
    forceFullscreen: { type: Boolean, default: true },
    allowLateSubmissions: { type: Boolean, default: false },
    enableWebcam: { type: Boolean, default: true },
    disableCopyPaste: { type: Boolean, default: true },
    requireIDVerification: { type: Boolean, default: true },
    exitPassword: { type: String, default: '' },
    anomalyThreshold: { type: Number, default: 20 }
}, { timestamps: true });

module.exports = mongoose.model('InstitutionSettings', institutionSettingsSchema);
