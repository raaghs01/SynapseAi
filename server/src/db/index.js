import mongoose from 'mongoose';
// import dns from 'dns';
// dns.setServers(['8.8.8.8', '8.8.4.4']);
// import dotenv from "dotenv";
// dotenv.config();

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is missing from your environment variables.");
        }
        const connectioninstance = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`connection success , Host:${connectioninstance.connection.host}`);
    } catch (error) {
        console.error("Mongodb connection failed",error);
        process.exit(1);
    }
}

export {connectDB};
