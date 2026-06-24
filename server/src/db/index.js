import mongoose from 'mongoose';
// import dotenv from "dotenv";
// dotenv.config();

const connectDB = async () => {
  
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
   // no need to apply try and catch
}

export default connectDB;
