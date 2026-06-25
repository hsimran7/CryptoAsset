import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const printUserJSON = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({});
    if (users.length > 0) {
      console.log('Keys of Mongoose Document:');
      console.log(Object.keys(users[0].toObject()));
      console.log('Raw JSON representation:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('No users found in database.');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error running test:', err.message);
  }
};

printUserJSON();
