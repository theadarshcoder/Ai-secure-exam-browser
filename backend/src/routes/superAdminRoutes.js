const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const superAdminController = require('../controllers/superAdminController');
const platformController = require('../controllers/platformSettingsController');
const healthController = require('../controllers/systemHealthController');

// All routes here are strictly for super_admin
router.use(verifyToken, checkRole(['super_admin']));

// Platform Monitoring & Health
router.get('/health', healthController.getSystemHealth);
router.get('/queues', healthController.getQueueStats);

// Demo Requests
router.get('/demo-requests', superAdminController.getDemoRequests);
router.post('/demo-requests/:id/approve', superAdminController.approveDemoRequest);
router.post('/demo-requests/:id/reject', superAdminController.rejectDemoRequest);

// Institutions
router.get('/institutions', superAdminController.getInstitutions);
router.get('/institutions/:id', superAdminController.getInstitutionDetails);
router.get('/institutions/:id/timeline', superAdminController.getInstitutionTimeline);
router.patch('/institutions/:id/status', superAdminController.updateInstitutionStatus);
router.post('/institutions/:id/reset-admin', superAdminController.resetAdminPassword);
router.post('/institutions/:id/add-admin', superAdminController.addInstitutionAdmin);
router.patch('/institutions/:id/limits', superAdminController.updateInstitutionLimits);

// Platform Governance & Settings
router.get('/settings', platformController.getSettings);
router.patch('/settings/mode', platformController.updateMode);
router.patch('/settings/announcement', platformController.updateAnnouncement);

// Platform Intelligence
router.get('/stats', superAdminController.getPlatformStats);
router.get('/audit-logs', superAdminController.getGlobalLogs);

module.exports = router;
