require('dotenv').config();
const mongoose = require('mongoose');
const ExamInvite = require('./src/models/ExamInvite');

async function checkInvite() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const invites = await ExamInvite.find({ email: 'vinitjangirr@gmail.com' })
        .populate('exam', 'title')
        .sort({ createdAt: -1 })
        .lean();

    console.log(`Found ${invites.length} invites for vinitjangirr@gmail.com`);
    
    invites.forEach(inv => {
        console.log(`- Exam: ${inv.exam?.title || 'Unknown'}`);
        console.log(`  Status: ${inv.status}`);
        console.log(`  Created: ${inv.createdAt}`);
        console.log(`  SentAt: ${inv.sentAt}`);
        console.log(`  ResendCount: ${inv.resendCount}`);
    });

    process.exit(0);
}

checkInvite().catch(console.error);
