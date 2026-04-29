const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { setCache } = require('../services/cacheService');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();


/**
 * 🛠️ Intelligence Worker Logic
 * This background process performs heavy MongoDB aggregations 
 * so the Admin UI remains lightning fast.
 */
const startIntelligenceWorker = () => {
    const worker = new Worker('intelligence_queue', async (job) => {
        const { studentId } = job.data;
        if (!studentId) return;

        console.log(`🧠 Worker: Processing intelligence for student ${studentId}...`);

        try {
            // 1. Fetch Dynamic Config
            const systemSettings = await Setting.findOne().lean() || {};
            const ANOMALY_THRESHOLD = systemSettings.anomalyThreshold || 20;
            const TAB_SWITCH_LIMIT = systemSettings.maxTabSwitches || 5;

            // 2. Perform Full Historical Aggregation
            const aggregationResult = await ExamSession.aggregate([
                { 
                    $match: { 
                        student: new mongoose.Types.ObjectId(studentId),
                        status: { $in: ['submitted', 'reviewed', 'auto_submitted', 'flagged'] }
                    } 
                },
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
            ]);

            const rawGlobal = aggregationResult[0] || { 
                totalExams: 0, totalPercentage: 0, passedExams: 0, totalTabSwitches: 0, allViolations: [] 
            };

            // 3. Advanced Intelligence Processing
            let weightedRiskScore = 0;
            const violationsBreakdown = {};

            rawGlobal.allViolations.flat().forEach(v => {
                if (!v) return;
                violationsBreakdown[v.type] = (violationsBreakdown[v.type] || 0) + 1;
                if (v.severity === 'critical') weightedRiskScore += 5;
                else if (v.severity === 'high') weightedRiskScore += 3;
                else if (v.severity === 'medium') weightedRiskScore += 2;
                else weightedRiskScore += 1;
            });
            weightedRiskScore += (rawGlobal.totalTabSwitches * 1);

            const avgPercentage = rawGlobal.totalExams > 0 ? (rawGlobal.totalPercentage / rawGlobal.totalExams).toFixed(1) : 0;
            const passRate = rawGlobal.totalExams > 0 ? ((rawGlobal.passedExams / rawGlobal.totalExams) * 100).toFixed(0) : 0;
            
            const MAX_RISK_PER_EXAM = 15;
            const maxPossibleRisk = rawGlobal.totalExams * MAX_RISK_PER_EXAM;
            const normalizedRisk = maxPossibleRisk > 0 ? Math.min((weightedRiskScore / maxPossibleRisk) * 100, 100).toFixed(0) : 0;

            // 4. Trend & Anomaly Detection (Comparing latest vs previous avg)
            const latestSessions = await ExamSession.find({ student: studentId, status: { $in: ['submitted', 'reviewed'] } })
                .sort({ startedAt: -1 })
                .limit(2)
                .lean();

            let anomalyDetected = null;
            if (latestSessions.length >= 2) {
                const latest = latestSessions[0];
                const prevAvg = (rawGlobal.totalPercentage - latest.percentage) / (rawGlobal.totalExams - 1 || 1);
                
                if ((latest.percentage - prevAvg) > ANOMALY_THRESHOLD && latest.tabSwitchCount >= TAB_SWITCH_LIMIT) {
                    anomalyDetected = {
                        message: `Suspicious score spike (+${(latest.percentage - prevAvg).toFixed(1)}%) with high tab switching.`,
                        exam: latest.examTitle || 'Recent Exam'
                    };
                }
            }

            const processedStats = {
                totalLifetimeExams: rawGlobal.totalExams,
                avgPercentage: `${avgPercentage}%`,
                passRate: `${passRate}%`,
                totalTabSwitches: rawGlobal.totalTabSwitches,
                riskScore: `${normalizedRisk}%`,
                riskLevel: normalizedRisk > 40 ? 'High 🔴' : normalizedRisk > 15 ? 'Medium 🟡' : 'Low 🟢',
                anomalyDetected,
                violationsBreakdown,
                preComputedAt: new Date()
            };

            // 5. Update Redis Cache (TTL: 24 hours for pre-computed data)
            const statsCacheKey = `student_stats_${studentId}`;
            await setCache(statsCacheKey, processedStats, 86400);

            console.log(`✅ Worker: Intelligence synced for student ${studentId}`);
        } catch (err) {
            console.error(`❌ Worker error for student ${studentId}:`, err.message);
            throw err;
        }
    }, { connection });


    worker.on('failed', (job, err) => {
        console.error(`💥 Job ${job.id} failed:`, err.message);
    });

    console.log('🤖 Intelligence Worker is active and listening for jobs.');
    return worker;
};

module.exports = { startIntelligenceWorker };
