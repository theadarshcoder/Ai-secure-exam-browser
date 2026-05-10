require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        // Delete all that don't have institutionId
        const result = await mongoose.connection.db.collection('settings').deleteMany({ 
            institutionId: { $exists: false } 
        });
        console.log('Deleted documents without institutionId:', result.deletedCount);

        // Delete all that have null institutionId
        const resultNull = await mongoose.connection.db.collection('settings').deleteMany({ 
            institutionId: null
        });
        console.log('Deleted documents with null institutionId:', resultNull.deletedCount);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
