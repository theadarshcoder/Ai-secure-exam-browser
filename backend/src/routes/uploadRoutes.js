const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken } = require('../middlewares/authMiddleware');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');

// ═════════════════════════════════════════════
// POST /api/upload/snapshot — Proctoring Snap
// ═════════════════════════════════════════════
router.post('/snapshot', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file received. Check multipart/form-data.' });

        const { sessionId, type } = req.body;
        const imageUrl = req.file.path; // Cloudinary returns secure URL in .path

        if (sessionId) {
            await ExamSession.findByIdAndUpdate(sessionId, {
                $push: { snapshots: { url: imageUrl, timestamp: new Date(), type } }
            });
        }

        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Snapshot upload failed:", error.message);
        res.status(500).json({ error: 'Snapshot upload failed', detail: error.message });
    }
});

// ═════════════════════════════════════════════
// POST /api/upload/profile — Face Photo (eKYC)
// ═════════════════════════════════════════════
router.post('/profile', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file received. Check multipart/form-data.' });

        const imageUrl = req.file.path;
        await User.findByIdAndUpdate(req.user.id, { profilePicture: imageUrl });
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Profile upload failed:", error.message);
        res.status(500).json({ error: 'Profile upload failed', detail: error.message });
    }
});

// ═════════════════════════════════════════════
// POST /api/upload/id-card — ID Card (eKYC)
// ═════════════════════════════════════════════
router.post('/id-card', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file received. Check multipart/form-data.' });

        const imageUrl = req.file.path;
        await User.findByIdAndUpdate(req.user.id, { idCardUrl: imageUrl });
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("ID card upload failed:", error.message);
        res.status(500).json({ error: 'ID card upload failed', detail: error.message });
    }
});

module.exports = router;
