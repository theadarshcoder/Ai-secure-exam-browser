const express = require('express');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, checkPermission('create_exam'), (req, res) => {
    res.json({ message: "Exam Created!" });
});

router.get('/live-grid', verifyToken, checkPermission('view_live_grid'), (req, res) => {
    res.json({ message: "Live Video Feed of Students" });
});

module.exports = router;

