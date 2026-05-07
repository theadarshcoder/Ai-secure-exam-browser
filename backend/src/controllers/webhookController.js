const crypto = require('crypto');
const ProcessedWebhook = require('../models/ProcessedWebhook');
const { billingQueue } = require('../queues/billingQueue');
const { verifySignature } = require('../services/paymentProviders/razorpayProvider');
const logger = require('../utils/logger');

/**
 * ⚓ Webhook Controller
 * Handles incoming payment provider events with high-security verification.
 */

exports.handleRazorpayWebhook = async (req, res) => {
    // 1. Strict Security Header Checks
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type' });
    }

    // 2. Replay Protection: Check if event is too old
    // Razorpay includes a timestamp in some headers or we can use the event body if available
    // Standard practice: Reject events older than 5 minutes
    const body = req.body.toString();
    let event;
    try {
        event = JSON.parse(body);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    // If event has a 'created_at' timestamp (Razorpay standard)
    if (event.created_at) {
        const eventAge = (Date.now() / 1000) - event.created_at;
        if (eventAge > 300) { // 5 minutes
            logger.warn(`🚨 [Webhook] Replay attempt detected. Event age: ${eventAge}s`);
            return res.status(400).json({ error: 'Event too old (Potential Replay)' });
        }
    }

    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 3. Audit Log (Received)
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
    
    try {
        // 3. Signature Verification
        if (!verifySignature(rawBody, signature, secret)) {
            logger.warn(`🚫 [Webhook] Invalid signature detected. IP: ${req.ip}`);
            
            await ProcessedWebhook.create({
                eventId: `fail_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                provider: 'razorpay',
                eventType: req.body.event || 'unknown',
                status: 'signature_invalid',
                payloadHash,
                rawPayload: rawBody.substring(0, 5000) // Store partial for audit
            });

            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody);
        const eventId = event.id; // Razorpay Webhook ID

        // 4. Atomic Idempotency Check (Insert First)
        try {
            const webhookRecord = new ProcessedWebhook({
                eventId,
                provider: 'razorpay',
                eventType: event.event,
                status: 'received',
                payloadHash,
                rawPayload: rawBody,
                institutionId: event.payload?.payment?.entity?.notes?.institutionId // Extract from metadata
            });
            await webhookRecord.save();
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                logger.info(`♻️ [Webhook] Duplicate event ignored: ${eventId}`);
                return res.status(200).json({ message: 'Duplicate event ignored' });
            }
            throw dbErr;
        }

        // 5. Extract Metadata & Enqueue Job
        // We never trust the frontend. The institutionId must be in the notes from checkout creation.
        const notes = event.payload?.payment?.entity?.notes || {};
        const institutionId = notes.institutionId;

        if (!institutionId && event.event.startsWith('payment.')) {
            logger.error(`⚠️ [Webhook] Missing institutionId in payment metadata: ${eventId}`);
            // Still return 200 to acknowledge receipt, but we can't process it.
            return res.status(200).json({ message: 'Missing institution metadata' });
        }

        // 6. Enqueue for background processing
        await billingQueue.add('process-razorpay-webhook', {
            eventId,
            eventType: event.event,
            provider: 'razorpay',
            institutionId,
            payload: {
                paymentId: event.payload?.payment?.entity?.id,
                amount: (event.payload?.payment?.entity?.amount || 0) / 100, // Convert paise to INR
                planId: notes.planId,
                billingCycle: notes.billingCycle,
                customerId: event.payload?.payment?.entity?.customer_id
            }
        });

        // 7. Instant 200 OK
        res.status(200).json({ status: 'OK', eventId });

    } catch (err) {
        logger.error(`🔥 [Webhook] Processing error: ${err.message}`);
        res.status(500).json({ error: 'Internal processing error' });
    }
};
