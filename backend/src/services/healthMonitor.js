const os = require('os');
const ErrorLog = require('../models/ErrorLog'); 
const ExamSession = require('../models/ExamSession');

// 🧠 PER-EXAM TRACKING STATE
const recentDisconnects = {}; // { "examId_123": 5 }
const prevLiveStudents = {};  // { "examId_123": 100 }
const lastAlertTimes = {};    // { "examId_123": { network: 0, errors: 0, drop: 0 } }

const startHealthMonitor = (io) => {
    console.log('🩺 [Health Monitor] Initialization successful. Monitoring starting...');
    setInterval(async () => {
        try {
            const now = Date.now();
            const oneMinAgo = new Date(now - 60000);

            // Fetch OS Level Metrics (Global)
            const cpuLoad = os.loadavg()[0]; 
            const memUsagePercent = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;

            // Get all active distinct exams
            const activeExams = await ExamSession.distinct('exam', { status: 'in_progress' });

            for (const examId of activeExams) {
                const examStr = examId.toString();
                
                // Initialize state for new exams
                if (!lastAlertTimes[examStr]) lastAlertTimes[examStr] = { network: 0, errors: 0, drop: 0 };
                if (!recentDisconnects[examStr]) recentDisconnects[examStr] = 0;

                // 1. Fetch Stats PER EXAM
                const liveCount = await ExamSession.countDocuments({ exam: examId, status: 'in_progress' });
                // Check if ErrorLog exists/has valid model structure, fallback to 0 if fails
                let errorCount = 0;
                try {
                    errorCount = await ErrorLog.countDocuments({ exam: examId, timestamp: { $gte: oneMinAgo } });
                } catch (e) {
                    // Ignore if ErrorLog schema is different
                }

                // Emit telemetry to admins (Include examId so UI can filter)
                io.to('role_admin').emit('server_health', {
                    examId: examStr,
                    liveStudents: liveCount,
                    cpuLoad: cpuLoad.toFixed(2),
                    memoryUsage: memUsagePercent.toFixed(0),
                    activeErrors: errorCount,
                    disconnects: recentDisconnects[examStr]
                });

                // 🔥 CRITICAL ALERTS PER EXAM 🔥

                // A. Sudden Mass Drop Detection
                const prevCount = prevLiveStudents[examStr];
                if (prevCount !== undefined && (prevCount - liveCount > 20)) {
                    if (now - lastAlertTimes[examStr].drop > 60000) { 
                        emitAlert(io, examStr, 'SERVER_OVERLOAD', `MASS DISCONNECT! Lost ${prevCount - liveCount} students suddenly.`, 'critical', now);
                        lastAlertTimes[examStr].drop = now;
                    }
                }
                prevLiveStudents[examStr] = liveCount;

                // B. Network Spike
                if (recentDisconnects[examStr] > 15) {
                    if (now - lastAlertTimes[examStr].network > 30000) { 
                        emitAlert(io, examStr, 'NETWORK_SPIKE', `${recentDisconnects[examStr]} socket disconnects in last 10s.`, 'critical', now);
                        lastAlertTimes[examStr].network = now;
                    }
                }

                // C. High Error Rate
                if (errorCount > 20) {
                    if (now - lastAlertTimes[examStr].errors > 60000) { 
                        emitAlert(io, examStr, 'HIGH_ERROR_RATE', `High error rate (${errorCount} errors/min).`, 'warning', now);
                        lastAlertTimes[examStr].errors = now;
                    }
                }

                // Reset disconnects window for this exam
                recentDisconnects[examStr] = 0; 
            }
        } catch (error) {
            console.error("Health monitor failed:", error);
        }
    }, 10000); 
};

// Helper for sending alerts
const emitAlert = (io, examId, type, message, severity, timestamp) => {
    io.to('role_admin').emit('system_alert', { id: timestamp, examId, type, message, severity });
};

// Called from socket.js
const incrementDisconnect = (examId) => {
    if(!examId) return;
    const id = examId.toString();
    recentDisconnects[id] = (recentDisconnects[id] || 0) + 1;
};

module.exports = { startHealthMonitor, incrementDisconnect };
