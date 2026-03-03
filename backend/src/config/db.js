const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            retries++;
            console.error(`❌ MongoDB connection attempt ${retries} failed: ${error.message}`);
            if (retries >= MAX_RETRIES) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
            // Wait before retrying (exponential backoff)
            await new Promise(res => setTimeout(res, Math.min(1000 * 2 ** retries, 30000)));
        }
    }
};

module.exports = connectDB;
