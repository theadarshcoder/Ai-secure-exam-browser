const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    institutionName: { type: String, required: true },
    phone: { type: String },
    website: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' }
}, { timestamps: true });

// Prevent duplicate pending requests from same email
demoRequestSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
