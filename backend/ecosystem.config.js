// ═══════════════════════════════════════════════════════════
//  ecosystem.config.js — PM2 Cluster Configuration
//  1000+ Students ke liye Production-Ready Scaling
// ═══════════════════════════════════════════════════════════

module.exports = {
    apps: [
        {
            // ─── App Identity ─────────────────────────────
            name: 'vision-api',
            script: 'src/server.js',

            // ─── Cluster Mode ─────────────────────────────
            // FREE TIER: Use 1 instance to save RAM (512MB Limit)
            // PAID TIER: Change to 'max' for full CPU utilization
            instances: 1,
            exec_mode: 'cluster',

            // ─── Memory & Restart Policy ──────────────────
            max_memory_restart: '512M',

            // ─── Environment Variables ────────────────────
            env: { NODE_ENV: 'development', PORT: 5000 },
            env_production: { 
                NODE_ENV: 'production', 
                PORT: 5000,
                DISABLE_INTERNAL_WORKERS: 'true' 
            },

            // ─── Logging ─────────────────────────────────
            combine_logs: true,
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',

            // ─── Zero-Downtime Deployment ─────────────────
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 15000,
        },
        {
            // ─── Worker Identity ──────────────────────────
            name: 'vision-worker',
            script: 'src/worker.js',

            // ─── Mode ─────────────────────────────────────
            // Workers should NOT use cluster mode. 1 dedicated process is best.
            instances: 1,
            exec_mode: 'fork',

            // ─── Memory & Restart Policy ──────────────────
            max_memory_restart: '1G',

            // ─── Environment Variables ────────────────────
            env: { NODE_ENV: 'development' },
            env_production: { NODE_ENV: 'production' },

            // ─── Logging ─────────────────────────────────
            combine_logs: true,
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
        }
    ]
};
