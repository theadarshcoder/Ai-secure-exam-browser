const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true, default: 'unknown' }, // Immutable role at time of action
    action: { type: String, required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    severity: { 
        type: String, 
        enum: ['info', 'warning', 'critical'], 
        default: 'info' 
    },
    details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

auditLogSchema.index({ severity: 1 });

// 🗑️ Auto-delete logs older than 30 days (MongoDB TTL Index)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
auditLogSchema.index({ createdAt: -1 }); // 🛡️ Fix for Admin Pagination sorting

module.exports = mongoose.model('AuditLog', auditLogSchema);

