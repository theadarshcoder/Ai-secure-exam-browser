# 🛠️ Vision Platform Operations Guide

This document outlines the production operations, disaster recovery, and maintenance protocols for the Vision SaaS Platform.

## 🚀 Deployment Checklist
1. **Environment Variables**: Ensure all variables in `envValidator.js` are set in the production dashboard.
2. **Database Migrations**: Run any pending MongoDB schema updates.
3. **Queue Check**: Verify Redis is accessible and Bull Board is reporting all queues as active.

## 🩺 Monitoring & Observability
- **Prometheus Metrics**: Accessible via `/health/metrics` (Admin Only).
- **Sentry**: Error tracking for both Backend and Frontend.
- **Health Checks**:
    - `/health/live`: Liveness probe.
    - `/health/ready`: Readiness probe (DB/Redis status).
    - `/health/detailed`: Internal metrics.

## 🚩 Feature Flags
Flags can be toggled via environment variables:
- `AI_ENABLED`: Enable/Disable AI proctoring services.
- `BILLING_ENABLED`: Enable/Disable subscription/payment processing.
- `MAINTENANCE_MODE`: Globally block non-admin routes.

## 🌋 Disaster Recovery (DR)
### MongoDB Failure
- **Symptoms**: Readiness check returns `DOWN`, 500 errors on all DB-linked routes.
- **Action**: Verify MongoDB Atlas/Local status. Switch to secondary cluster if using Replica Sets.

### Redis Crash
- **Symptoms**: Queues stop processing, real-time broadcasts fail, rate limiters might block everyone.
- **Action**: Restart Redis service. Queues will automatically reconnect and resume processing.

### Webhook Outage
- **Symptoms**: Payments are made but subscriptions don't activate.
- **Action**: Use `POST /api/admin/ops/queues/replay-dlq` once the upstream (Razorpay) is back online.

## 🔄 Restore Drills
- **Frequency**: Monthly.
- **Step**: Download a database snapshot, restore to a temporary "Drill" cluster, and verify data integrity.

## 📜 Log Retention
- **Pino Logs**: Recommended 30-day retention in log aggregator (CloudWatch/Loki).
- **BullMQ**: Successfully completed jobs are removed from Redis automatically. Failed jobs are kept for 7 days or until manually cleared.
