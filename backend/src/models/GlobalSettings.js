const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    platformMode: {
        type: String,
        enum: ['active', 'readonly', 'maintenance', 'locked'],
        default: 'active'
    },
    maintenanceMessage: {
        type: String,
        default: 'System is currently undergoing scheduled maintenance. Please check back later.'
    },
    announcement: {
        title: { type: String },
        message: { type: String },
        isActive: { type: Boolean, default: false },
        target: { type: String, enum: ['all', 'admin', 'mentor', 'student'], default: 'all' }
    },
    // Versioning / History
    history: [{
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        reason: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Singleton pattern: Ensure only one settings document exists
globalSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ platformMode: 'active' });
    }
    return settings;
};

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
