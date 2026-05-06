const { Queue } = require('bullmq');
const { getRedisConnection } = require('./src/config/redis');
const dotenv = require('dotenv');

dotenv.config();

async function checkQueue() {
    const connection = getRedisConnection();
    const queue = new Queue('AutoSubmitQueue', { connection });

    const repeatableJobs = await queue.getRepeatableJobs();
    console.log('Repeatable Jobs:', JSON.stringify(repeatableJobs, null, 2));

    const jobCount = await queue.getJobCounts();
    console.log('Job Counts:', jobCount);

    process.exit(0);
}

checkQueue().catch(console.error);
