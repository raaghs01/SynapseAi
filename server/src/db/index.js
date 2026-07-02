import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
// import dotenv from "dotenv";
// dotenv.config();

const connectDB = async () => {
  
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
   // no need to apply try and catch
}

export {connectDB};
