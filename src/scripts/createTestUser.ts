// scripts/createTestUser.ts

import mongoose from 'mongoose';
import User from "../userModels/user";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    console.log('Starting test user creation script...');
    
    // Connect to MongoDB
    const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING;
    if (!connectionString) {
      console.error('MongoDB connection string not found in environment variables');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB: ${connectionString.substring(0, 20)}...`);
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB successfully');

    // Test user credentials
    const testEmail = "testuser@example.com";
    const testPassword = "TestUser@123";
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log(`Test user with email ${testEmail} already exists.`);
      console.log('Updating test user...');
      
      // Generate new password hash
      const hashedPassword = await bcrypt.hash(testPassword, 8);
      
      // Update user
      existingUser.password = hashedPassword;
      existingUser.firstName = "Test";
      existingUser.lastName = "User";
      existingUser.isAdmin = false; // Ensure this is a regular user
      
      await existingUser.save();
      console.log('Test user has been updated');
    } else {
      console.log(`Creating new test user with email: ${testEmail}`);
      
      // Create new test user
      const hashedPassword = await bcrypt.hash(testPassword, 8);
      
      const newUser = new User({
        email: testEmail,
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        isAdmin: false // Regular user, not admin
      });
      
      await newUser.save();
      console.log('Test user created successfully');
    }
    
    // Verify test user
    const verifiedUser = await User.findOne({ email: testEmail });
    
    if (verifiedUser) {
      console.log('\n--- TEST USER ACCOUNT INFO ---');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      console.log(`ID: ${verifiedUser._id}`);
      console.log(`isAdmin: ${verifiedUser.isAdmin}`);
      console.log('-----------------------------\n');
      
      // Test password verification
      const passwordMatch = await bcrypt.compare(testPassword, verifiedUser.password);
      console.log(`Password verification test: ${passwordMatch ? "SUCCESS" : "FAILED"}`);
      
      console.log('\nYou can now log in with these test credentials.');
    } else {
      console.error('Failed to verify test user creation!');
    }
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createTestUser();