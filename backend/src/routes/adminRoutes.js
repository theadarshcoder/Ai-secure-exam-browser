const express = require('express');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

router.put('/update-mentor-permissions/:mentorId', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { newPermissions } = req.body;
        const oldMentor = await User.findById(req.params.mentorId);
        if (!oldMentor) return res.status(404).json({ message: "Mentor not found" });

        const mentor = await User.findByIdAndUpdate(req.params.mentorId, { permissions: newPermissions }, { new: true });
        await AuditLog.create({
            adminId: req.user.id,
            action: 'UPDATE_PERMISSIONS',
            targetUserId: req.params.mentorId,
            details: { oldPermissions: oldMentor.permissions, newPermissions: mentor.permissions }
        });
        res.json({ message: "Permissions updated!", mentor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/logs', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('adminId', 'name email').populate('targetUserId', 'name email').sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


