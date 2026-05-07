const mongoose = require('mongoose');

const institutionUsageSchema = new mongoose.Schema({
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true,
        unique: true
    },
    studentsUsed: {
        type: Number,
        default: 0
    },
    examsUsed: {
        type: Number,
        default: 0
    },
    mentorsUsed: {
        type: Number,
        default: 0
    },
    aiMinutesUsed: {
        type: Number,
        default: 0
    },
    lastResetAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('InstitutionUsage', institutionUsageSchema);
