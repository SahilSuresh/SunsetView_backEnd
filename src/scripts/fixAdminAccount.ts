// scripts/fixAdminAccount.ts

import mongoose from 'mongoose';
import User from "../userModels/user";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const fixAdminAccount = async () => {
  try {
    console.log('Starting admin account fix script...');
    
    // Connect to MongoDB
    const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING;
    if (!connectionString) {
      console.error('MongoDB connection string not found in environment variables');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB: ${connectionString.substring(0, 20)}...`);
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB successfully');

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';
    
    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in environment variables');
      process.exit(1);
    }

    console.log(`Looking for admin account with email: ${adminEmail}`);
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    // Test a password hash to make sure bcrypt is working correctly
    const testPassword = "Admin@123456";
    const testHash = await bcrypt.hash(testPassword, 8);
    console.log(`Test password hash generation: ${testHash.substring(0, 20)}...`);
    
    // Test password verification
    if (existingAdmin) {
      const passwordCheck = await bcrypt.compare(adminPassword, existingAdmin.password);
      console.log(`Current password match test: ${passwordCheck ? "SUCCESS" : "FAILED"}`);
    }
    
    // If admin exists, completely update it with fresh credentials
    if (existingAdmin) {
      console.log('\n--- CURRENT ADMIN ACCOUNT STATE ---');
      console.log(`ID: ${existingAdmin._id}`);
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`First Name: ${existingAdmin.firstName}`);
      console.log(`Last Name: ${existingAdmin.lastName}`);
      console.log(`isAdmin flag: ${existingAdmin.isAdmin}`);
      console.log(`Password hash: ${existingAdmin.password.substring(0, 20)}...`);
      console.log('-----------------------------\n');

      console.log('Updating admin account with fresh credentials...');
      
      // Generate fresh password hash
      const hashedPassword = await bcrypt.hash(adminPassword, 8);
      console.log(`Generated new password hash: ${hashedPassword.substring(0, 20)}...`);
      
      // Update the admin account with fresh values
      existingAdmin.isAdmin = true;
      existingAdmin.password = hashedPassword;
      existingAdmin.firstName = adminFirstName;
      existingAdmin.lastName = adminLastName;
      
      await existingAdmin.save();
      console.log('Admin account has been updated with new credentials');
      
      // Verify the save worked by doing a fresh query
      const verifiedAdmin = await User.findOne({ email: adminEmail });
      
      // Test the updated password
      if (verifiedAdmin) {
        const passwordCheck = await bcrypt.compare(adminPassword, verifiedAdmin.password);
        console.log(`New password match test: ${passwordCheck ? "SUCCESS" : "FAILED"}`);
      }
    } else {
      console.log(`Admin user ${adminEmail} not found. Creating new admin account...`);
      
      // Create new admin user with manual password hashing
      const hashedPassword = await bcrypt.hash(adminPassword, 8);
      console.log(`Generated password hash: ${hashedPassword.substring(0, 20)}...`);
      
      const newAdmin = new User({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        isAdmin: true
      });
      
      await newAdmin.save();
      console.log(`Created new admin user with email: ${adminEmail}`);
      
      // Test the new account by trying to find it
      const verifiedAdmin = await User.findOne({ email: adminEmail });
      
      if (!verifiedAdmin) {
        console.error('Failed to create new admin account!');
        process.exit(1);
      }
      
      // Test the new password
      const passwordCheck = await bcrypt.compare(adminPassword, verifiedAdmin.password);
      console.log(`New account password match test: ${passwordCheck ? "SUCCESS" : "FAILED"}`);
    }
    
    // Final verification
    const finalAdmin = await User.findOne({ email: adminEmail });
    
    console.log('\n--- FINAL ADMIN ACCOUNT STATE ---');
    if (finalAdmin) {
      console.log(`ID: ${finalAdmin._id}`);
      console.log(`Email: ${finalAdmin.email}`);
      console.log(`First Name: ${finalAdmin.firstName}`);
      console.log(`Last Name: ${finalAdmin.lastName}`);
      console.log(`isAdmin flag: ${finalAdmin.isAdmin}`);
      console.log(`Password hash: ${finalAdmin.password.substring(0, 20)}...`);
      
      if (finalAdmin.isAdmin !== true) {
        console.error('ERROR: Admin account still does not have isAdmin=true!');
      } else {
        console.log('\nSUCCESS: Admin account has been fixed and verified');
        console.log(`\nYou can now log in with:\nEmail: ${adminEmail}\nPassword: ${adminPassword}`);
      }
    } else {
      console.error('ERROR: Admin account not found after fix attempt!');
    }
    
  } catch (error) {
    console.error('Error fixing admin account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix script
fixAdminAccount();