const client = require('prom-client');
const logger = require('./logger');

/**
 * 📊 Prometheus Metrics Configuration
 * - Collects default Node.js metrics (CPU, Heap, GC)
 * - Custom HTTP metrics (Duration, Count)
 * - Custom Queue metrics (Throughput, Failures)
 * - WebSocket metrics (Active connections)
 */

// 1. Initialize Registry
const register = new client.Registry();

// 2. Add Default Metrics (Heap, CPU, etc.)
client.collectDefaultMetrics({
    register,
    prefix: 'vision_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// 3. Custom HTTP Metrics
const httpRequestsTotal = new client.Counter({
    name: 'vision_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status', 'env'],
    registers: [register]
});

const httpRequestDuration = new client.Histogram({
    name: 'vision_http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'path', 'env'],
    buckets: [10, 50, 100, 300, 500, 1000, 3000, 5000],
    registers: [register]
});

// 4. Custom Queue Metrics
const queueJobsTotal = new client.Counter({
    name: 'vision_queue_jobs_total',
    help: 'Total number of queue jobs processed',
    labelNames: ['queue', 'status', 'env'], // status: completed, failed, retried
    registers: [register]
});

// 5. WebSocket Metrics
const wsActiveConnections = new client.Gauge({
    name: 'vision_websocket_active_connections',
    help: 'Number of active WebSocket connections',
    labelNames: ['env'],
    registers: [register]
});

// 6. Business Metrics (Low Cardinality)
const activeExamsGauge = new client.Gauge({
    name: 'vision_active_exams_total',
    help: 'Number of exams currently in progress',
    labelNames: ['env'],
    registers: [register]
});

const aiViolationsTotal = new client.Counter({
    name: 'vision_ai_violations_total',
    help: 'Total AI violations flagged',
    labelNames: ['type', 'env'],
    registers: [register]
});

// 7. Event Loop Lag Metric (Exposing the existing lag monitoring)
const eventLoopLagGauge = new client.Gauge({
    name: 'vision_event_loop_lag_ms',
    help: 'Current event loop lag in milliseconds',
    labelNames: ['env'],
    registers: [register]
});

/**
 * Update the event loop lag metric
 * Called from the monitor.js interval
 */
const updateEventLoopLag = (lag) => {
    eventLoopLagGauge.set({ env: process.env.NODE_ENV || 'development' }, lag);
};

module.exports = {
    register,
    httpRequestsTotal,
    httpRequestDuration,
    queueJobsTotal,
    wsActiveConnections,
    activeExamsGauge,
    aiViolationsTotal,
    updateEventLoopLag,
    metricsContentType: register.contentType
};
