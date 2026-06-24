import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Connection Error] Failed to connect: ${error.message}`);
    // Exiting the process on connection failure
    process.exit(1);
  }
};

export default connectDB;
