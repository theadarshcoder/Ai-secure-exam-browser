const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const User = require('../models/User');
const ExamInvite = require('../models/ExamInvite');
const cacheService = require('../services/cacheService');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * 📈 Get Strategic Institutional Analytics
 * Includes: Growth, Funnel, Risk Leaderboard, Duration Analysis
 */
exports.getStrategicAnalytics = async (req, res) => {
    try {
        const { examId, institutionId, startDate, endDate, range } = req.query;
        
        // 🛡️ Isolation & RBAC
        const targetInstitution = req.user.role === 'super_admin' ? institutionId : req.user.institutionId;
        
        const cacheKey = `strategic_stats_v3_${targetInstitution || 'global'}_${examId || 'all'}_${startDate || 'none'}_${endDate || 'none'}_${range || 'none'}`;
        const cachedData = await cacheService.getCache(cacheKey);
        
        if (cachedData) {
            return res.status(200).json({ success: true, data: cachedData, fromCache: true });
        }

        const match = {};
        if (targetInstitution) match.institutionId = new mongoose.Types.ObjectId(targetInstitution);
        if (examId) match.exam = new mongoose.Types.ObjectId(examId);
        
        const dateFilter = {};
        if (startDate || endDate || range) {
            if (startDate) {
                dateFilter.$gte = new Date(startDate);
            } else if (range) {
                const now = new Date();
                if (range === '7d') dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
                else if (range === '30d') dateFilter.$gte = new Date(now.setDate(now.getDate() - 30));
                else if (range === '90d') dateFilter.$gte = new Date(now.setDate(now.getDate() - 90));
            }
            if (endDate) dateFilter.$lte = new Date(endDate);

            if (Object.keys(dateFilter).length > 0) {
                match.createdAt = dateFilter;
            }
        }

        // 1. 🏗️ Usage Growth (Monthly creation) - 24h Cache recommended but for now 1h is okay
        const userGrowth = await User.aggregate([
            { $match: targetInstitution ? { institutionId: new mongoose.Types.ObjectId(targetInstitution) } : {} },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const examGrowth = await Exam.aggregate([
            { $match: targetInstitution ? { institutionId: new mongoose.Types.ObjectId(targetInstitution) } : {} },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. 🌪️ Funnel Analysis (Invited -> Started -> Submitted -> Abandoned)
        const inviteCount = await ExamInvite.countDocuments(match);
        
        const sessionStats = await ExamSession.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    started: { $sum: 1 },
                    submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
                    blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
                    avgDuration: { 
                        $avg: { 
                            $divide: [
                                { $subtract: ['$submittedAt', '$startedAt'] },
                                60000 // Convert to minutes
                            ]
                        } 
                    }
                }
            }
        ]);

        const funnel = {
            invited: inviteCount,
            started: sessionStats[0]?.started || 0,
            submitted: sessionStats[0]?.submitted || 0,
            blocked: sessionStats[0]?.blocked || 0,
            abandoned: Math.max(0, (sessionStats[0]?.started || 0) - (sessionStats[0]?.submitted || 0) - (sessionStats[0]?.blocked || 0))
        };

        // 3. 🚩 Top Risk Exams (Top 5)
        const topRiskExams = await ExamSession.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$exam',
                    violationTotal: { $sum: '$violationCount' },
                    sessionTotal: { $sum: 1 },
                    avgRisk: { $avg: '$riskScore' }
                }
            },
            { $addFields: { riskRatio: { $divide: ['$violationTotal', '$sessionTotal'] } } },
            { $sort: { riskRatio: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'exams',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'examInfo'
                }
            },
            { $unwind: '$examInfo' },
            {
                $project: {
                    title: '$examInfo.title',
                    riskRatio: 1,
                    sessionTotal: 1,
                    avgRisk: 1
                }
            }
        ]);

        // 4. ⚡ Anomaly Detection (Violation Spikes in last 24h vs last 7d)
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const recentViolations = await ExamSession.aggregate([
            { $match: { ...match, startedAt: { $gte: lastWeek } } },
            {
                $group: {
                    _id: { $cond: [{ $gte: ['$startedAt', yesterday] }, 'last24h', 'previous6d'] },
                    vCount: { $sum: '$violationCount' }
                }
            }
        ]);

        const last24h = recentViolations.find(v => v._id === 'last24h')?.vCount || 0;
        const previousAvg = (recentViolations.find(v => v._id === 'previous6d')?.vCount || 0) / 6;
        const anomalyDetected = previousAvg > 0 && (last24h / previousAvg) > 2.0;

        const data = {
            funnel,
            growth: {
                users: userGrowth,
                exams: examGrowth
            },
            riskLeaderboard: topRiskExams,
            avgCompletionMinutes: sessionStats[0]?.avgDuration || 0,
            anomaly: {
                detected: anomalyDetected,
                spikeFactor: previousAvg > 0 ? (last24h / previousAvg).toFixed(2) : 0,
                last24h,
                baseline: previousAvg.toFixed(2)
            }
        };

        // Cache for 1 hour
        await cacheService.setCache(cacheKey, data, 3600);

        res.status(200).json({ success: true, data });
    } catch (error) {
        logger.error({ err: error.message }, 'Strategic Analytics Failed');
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
