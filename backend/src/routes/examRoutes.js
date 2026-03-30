const express = require('express');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, checkPermission('create_exam'), (req, res) => {
    const mockId = 'EXM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    res.json({ 
        message: "Exam Created!", 
        id: mockId,
        status: "published"
    });
});

router.get('/live-grid', verifyToken, checkPermission('view_live_grid'), (req, res) => {
    res.json({ message: "Live Video Feed of Students" });
});

module.exports = router;

