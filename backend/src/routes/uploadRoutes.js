const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken } = require('../middlewares/authMiddleware');
const ExamSession = require('../models/ExamSession');

// Upload Snapshot & Link to Session
router.post('/snapshot', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { sessionId, type } = req.body; // type can be 'violation' or 'random'
        const imageUrl = req.file.path; // Cloudinary uses .path for the secure URL

        // DB update (Push URL to session)
        if (sessionId) {
            await ExamSession.findByIdAndUpdate(sessionId, {
                $push: { snapshots: { url: imageUrl, timestamp: new Date(), type } }
            });
        }

        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

module.exports = router;
