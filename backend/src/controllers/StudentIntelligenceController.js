const mongoose = require('mongoose');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { getRedisClient } = require('../config/redis');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// 🚀 Student Intelligence Dashboard Controller
// Designed for production-grade analytics and AI-powered insights

exports.getStudentIntelligence = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const redis = getRedisClient();
    const cacheKey = `student_intelligence:${studentId}:p${page}`;

    // 1. Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return res.json(JSON.parse(cachedData));
    }

    // 2. Validate Student ID
    if (!mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({ error: 'Invalid Student ID format' });
    }

    const student = await User.findById(studentId).select('name email profilePicture isVerified').lean();
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    // 3. Dynamic Thresholds from Settings
    const settings = await Setting.findOne().lean() || {};
    const ANOMALY_THRESHOLD = settings.anomalyThreshold || 25;
    const MAX_TAB_SWITCHES = settings.maxTabSwitches || 5;

    // 4. Optimized Aggregation Pipeline
    const results = await ExamSession.aggregate([
        { 
            $match: { 
                student: new mongoose.Types.ObjectId(studentId),
                status: { $in: ['submitted', 'reviewed', 'auto_submitted', 'flagged'] }
            } 
        },
        { $sort: { submittedAt: -1 } },
        {
            $facet: {
                "overviewData": [
                    {
                        $group: {
                            _id: null,
                            totalExams: { $sum: 1 },
                            totalPercentage: { $sum: "$percentage" },
                            passedExams: { $sum: { $cond: ["$passed", 1, 0] } },
                            totalTabSwitches: { $sum: "$tabSwitchCount" },
                            allViolations: { $push: "$violations" }
                        }
                    }
                ],
                "categoryPerformance": [
                    {
                        $lookup: {
                            from: "exams",
                            localField: "exam",
                            foreignField: "_id",
                            as: "examInfo"
                        }
                    },
                    { $unwind: "$examInfo" },
                    {
                        $group: {
                            _id: "$examInfo.category",
                            avgScore: { $avg: "$percentage" },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { avgScore: -1 } }
                ],
                "recentTrend": [
                    { $limit: 5 },
                    { $project: { percentage: 1, submittedAt: 1 } }
                ],
                "timeline": [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'exams',
                            localField: 'exam',
                            foreignField: '_id',
                            as: 'examInfo'
                        }
                    },
                    { $unwind: "$examInfo" },
                    {
                        $project: {
                            _id: 1,
                            examTitle: "$examInfo.title",
                            category: "$examInfo.category",
                            score: 1,
                            percentage: 1,
                            passed: 1,
                            status: 1,
                            tabSwitches: "$tabSwitchCount",
                            violations: 1,
                            startedAt: 1,
                            submittedAt: 1
                        }
                    }
                ],
                "totalCount": [
                    { $count: "count" }
                ]
            }
        }
    ]);

    const data = results[0] || { overviewData: [], categoryPerformance: [], recentTrend: [], timeline: [], totalCount: [] };
    const overview = data.overviewData[0] || { totalExams: 0, totalPercentage: 0, passedExams: 0, totalTabSwitches: 0, allViolations: [] };
    const totalExams = overview.totalExams;

    // --- Risk Scoring Logic ---
    let weightedRisk = 0;
    const violationsBreakdown = {};
    
    overview.allViolations.flat().forEach(v => {
        if (!v) return;
        violationsBreakdown[v.type] = (violationsBreakdown[v.type] || 0) + 1;
        switch (v.severity) {
            case 'critical': weightedRisk += 5; break;
            case 'high': weightedRisk += 3; break;
            case 'medium': weightedRisk += 2; break;
            case 'low': weightedRisk += 1; break;
            default: weightedRisk += 1;
        }
    });
    weightedRisk += (overview.totalTabSwitches * 0.5); // Tab switches contribute but slightly less weight per unit

    // Normalize Risk (0-100)
    // Formula: (Weighted Risk / (Total Exams * Max Possible Risk Factor)) * 100
    const MAX_RISK_FACTOR = 10; 
    const riskScore = totalExams > 0 ? Math.min((weightedRisk / (totalExams * MAX_RISK_FACTOR)) * 100, 100).toFixed(0) : 0;

    // --- Insight Logic ---
    const strongArea = data.categoryPerformance[0]?._id || 'N/A';
    const weakArea = data.categoryPerformance.length > 1 ? data.categoryPerformance[data.categoryPerformance.length - 1]?._id : 'N/A';
    
    // Improvement Trend
    let improvementTrend = 'stable';
    if (data.recentTrend.length >= 2) {
        const scores = data.recentTrend.map(t => t.percentage).reverse();
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avg2 > avg1 + 5) improvementTrend = 'increasing';
        else if (avg2 < avg1 - 5) improvementTrend = 'declining';
    }

    // Anomaly Detection
    let anomaly = null;
    if (data.recentTrend.length > 0 && totalExams > 1) {
        const latest = data.recentTrend[0];
        const historicalAvg = (overview.totalPercentage - latest.percentage) / (totalExams - 1);
        if (latest.percentage > historicalAvg + ANOMALY_THRESHOLD) {
            anomaly = {
                type: 'Sudden Score Spike',
                message: `Recent score (${latest.percentage}%) is significantly higher than historical average (${historicalAvg.toFixed(1)}%).`,
                severity: 'high'
            };
        }
    }

    // Cheating Pattern
    let cheatingPattern = 'Consistent';
    if (overview.totalTabSwitches > totalExams * MAX_TAB_SWITCHES) {
        cheatingPattern = 'High Tab Switching';
    } else if (weightedRisk / totalExams > 3) {
        cheatingPattern = 'Frequent Rule Violations';
    }

    // --- Final Response Structure ---
    const response = {
        student: {
            info: student,
            overview: {
                totalExams,
                avgPercentage: totalExams > 0 ? (overview.totalPercentage / totalExams).toFixed(1) : 0,
                passRate: totalExams > 0 ? ((overview.passedExams / totalExams) * 100).toFixed(0) : 0,
                totalViolations: Object.values(violationsBreakdown).reduce((a, b) => a + b, 0),
                totalTabSwitches: overview.totalTabSwitches
            }
        },
        intelligence: {
            riskScore: parseInt(riskScore),
            riskLevel: riskScore > 60 ? 'High' : riskScore > 25 ? 'Medium' : 'Low',
            violationsBreakdown,
            cheatingPattern
        },
        insights: {
            strongArea,
            weakArea,
            improvementTrend,
            anomalyDetection: anomaly
        },
        timelineData: data.timeline,
        pagination: {
            total: data.totalCount[0]?.count || 0,
            page,
            limit,
            pages: Math.ceil((data.totalCount[0]?.count || 0) / limit)
        },
        generatedAt: new Date()
    };

    // Cache the result for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);

    res.json(response);
});
