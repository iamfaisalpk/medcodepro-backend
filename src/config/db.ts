import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log(`\uD83D\uDE80 MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
