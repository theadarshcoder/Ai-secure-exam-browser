const ExamSession = require('../models/ExamSession');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const Institution = require('../models/Institution');
const cacheService = require('../services/cacheService');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * 📊 Get Operational AI Analytics
 * Includes: Violation Breakdown, Temporal Trends, Risk Distribution
 */
exports.getOperationalAnalytics = async (req, res) => {
    try {
        const { examId, institutionId, startDate, endDate } = req.query;
        
        // 🛡️ RBAC & Isolation
        const targetInstitution = req.user.role === 'super_admin' ? institutionId : req.user.institutionId;
        
        // ⚡ Cache Key generation
        const cacheKey = `ai_stats_v2_${targetInstitution || 'global'}_${examId || 'all'}_${startDate || 'none'}_${endDate || 'none'}`;
        const cachedData = await cacheService.getCache(cacheKey);
        
        if (cachedData) {
            return res.status(200).json({ success: true, data: cachedData, fromCache: true });
        }

        // Build Match Filter
        const match = {};
        if (targetInstitution) match.institutionId = new mongoose.Types.ObjectId(targetInstitution);
        if (examId) match.exam = new mongoose.Types.ObjectId(examId);
        if (startDate || endDate) {
            match.startedAt = {};
            if (startDate) match.startedAt.$gte = new Date(startDate);
            if (endDate) match.startedAt.$lte = new Date(endDate);
        }

        // 1. Violation Breakdown by Type
        const typeBreakdown = await ExamSession.aggregate([
            { $match: match },
            { $unwind: '$violations' },
            { $group: { _id: '$violations.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 2. Risk Distribution (LOW, MEDIUM, HIGH, CRITICAL)
        const riskDistribution = await ExamSession.aggregate([
            { $match: match },
            { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
        ]);

        // 3. Temporal Trend (Violations over time - last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const timeline = await ExamSession.aggregate([
            { $match: { ...match, startedAt: { $gte: sevenDaysAgo } } },
            { $unwind: '$violations' },
            {
                $group: {
                    _id: {
                        year: { $year: '$violations.timestamp' },
                        month: { $month: '$violations.timestamp' },
                        day: { $dayOfMonth: '$violations.timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // 4. Summary Stats
        const summaryStats = await ExamSession.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    totalViolations: { $sum: '$violationCount' },
                    avgRiskScore: { $avg: '$riskScore' },
                    highRiskCount: {
                        $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
                    }
                }
            }
        ]);

        // 5. False Positive Rate (False Positives / Reviewed Violations)
        const fpStats = await ExamSession.aggregate([
            { $match: match },
            { $unwind: '$violations' },
            {
                $group: {
                    _id: null,
                    totalReviewed: {
                        $sum: { $cond: [{ $in: ['$violations.reviewStatus.status', ['confirmed', 'false_positive']] }, 1, 0] }
                    },
                    falsePositives: {
                        $sum: { $cond: [{ $eq: ['$violations.reviewStatus.status', 'false_positive'] }, 1, 0] }
                    }
                }
            }
        ]);

        // 6. Recent Suspicious Sessions Feed
        const recentSuspicious = await ExamSession.find(match)
            .sort({ lastActivity: -1 })
            .limit(10)
            .populate('student', 'name email')
            .populate('exam', 'title')
            .lean();

        const formattedRecent = recentSuspicious.map(s => {
            const latestV = s.violations && s.violations.length > 0 ? s.violations[s.violations.length - 1] : null;
            return {
                _id: s._id,
                sessionId: s._id,
                studentName: s.student?.name || 'Unknown',
                examName: s.exam?.title || 'Unknown Exam',
                examId: s.exam?._id,
                riskLevel: s.riskLevel,
                riskScore: s.riskScore,
                latestViolationType: latestV?.type || 'N/A',
                violationId: latestV?._id,
                timestamp: latestV?.timestamp || s.updatedAt,
                reviewStatus: latestV?.reviewStatus?.status || 'pending'
            };
        });

        const data = {
            summary: summaryStats[0] || { totalSessions: 0, totalViolations: 0, avgRiskScore: 0, highRiskCount: 0 },
            typeBreakdown,
            riskDistribution,
            timeline,
            fpRate: fpStats[0] && fpStats[0].totalReviewed > 0 
                ? (fpStats[0].falsePositives / fpStats[0].totalReviewed) * 100 
                : 0,
            recentSuspicious: formattedRecent
        };

        // Cache for 60 seconds
        await cacheService.setCache(cacheKey, data, 60);

        res.status(200).json({ success: true, data });
    } catch (error) {
        logger.error({ err: error.message }, 'AI Analytics Failed');
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * 🛠️ Update Violation Review Status
 * Human-in-the-loop correction
 */
exports.updateViolationReview = async (req, res) => {
    const { sessionId, violationId, status, reason } = req.body;

    if (!['confirmed', 'false_positive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (!reason) {
        return res.status(400).json({ success: false, message: 'Reason is mandatory for review' });
    }

    try {
        const session = await ExamSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const violation = session.violations.id(violationId);
        if (!violation) return res.status(404).json({ success: false, message: 'Violation not found' });

        // Update violation status
        violation.reviewStatus = {
            status,
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            reason
        };

        // 🏎️ Recalculate Risk Score
        // Weight mapping: low: 1, medium: 3, high: 7, critical: 15
        const weights = { low: 1, medium: 3, high: 7, critical: 15 };
        let newRiskScore = 0;
        
        session.violations.forEach(v => {
            if (v.reviewStatus.status !== 'false_positive') {
                newRiskScore += weights[v.severity?.toLowerCase()] || 3;
            }
        });

        session.riskScore = newRiskScore;
        
        // Update Risk Level
        if (newRiskScore > 20) session.riskLevel = 'CRITICAL';
        else if (newRiskScore > 10) session.riskLevel = 'HIGH';
        else if (newRiskScore > 5) session.riskLevel = 'MEDIUM';
        else session.riskLevel = 'LOW';

        await session.save();

        // 🛡️ Audit Log
        await AuditLog.create({
            performedBy: req.user.id,
            actorRole: req.user.role,
            action: 'VIOLATION_REVIEW',
            targetUserId: session.student,
            institutionId: session.institutionId,
            severity: status === 'false_positive' ? 'warning' : 'info',
            details: {
                sessionId,
                violationId,
                oldStatus: violation.reviewStatus.status,
                newStatus: status,
                reason,
                newRiskScore
            }
        });

        // Invalidate analytics cache for this institution
        const cacheKeyPattern = `ai_stats_${session.institutionId}*`;
        // cacheService.delPattern(cacheKeyPattern); // If supported

        res.status(200).json({ success: true, message: 'Violation reviewed successfully', data: { riskScore: session.riskScore, riskLevel: session.riskLevel } });
    } catch (error) {
        logger.error({ err: error.message }, 'Violation Review Failed');
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * 🔒 Toggle AI Features
 * Governance control at different scopes
 */
exports.toggleAIFeatures = async (req, res) => {
    const { scope, targetId, enabled } = req.body; // scope: 'global', 'institution', 'exam'

    try {
        if (scope === 'global' && req.user.role === 'super_admin') {
            await Setting.findOneAndUpdate({}, { 'features.aiProctoring': enabled }, { upsert: true });
            await cacheService.delCache('global_settings');
        } else if (scope === 'institution') {
            const instId = req.user.role === 'super_admin' ? targetId : req.user.institutionId;
            await Institution.findByIdAndUpdate(instId, { 'settings.aiEnabled': enabled });
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized scope or role' });
        }

        res.status(200).json({ success: true, message: `AI Features ${enabled ? 'enabled' : 'disabled'} for ${scope}` });
    } catch (error) {
        logger.error({ err: error.message }, 'Toggle AI Features Failed');
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
