// scripts/resetPasswords.ts
import mongoose from 'mongoose';
import User from "../userModels/user";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resetPasswords = async () => {
  try {
    console.log('Starting password reset script...');
    
    // Connect to MongoDB
    const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING;
    if (!connectionString) {
      console.error('MongoDB connection string not found in environment variables');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB: ${connectionString.substring(0, 20)}...`);
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB successfully');

    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sunsetview.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    
    // ===== STEP 1: Directly update using MongoDB methods to bypass any hooks =====
    console.log("STEP 1: Direct password update for admin user");
    
    // Hash the password directly
    const adminPasswordHash = await bcrypt.hash(adminPassword, 8);
    console.log(`Generated admin password hash: ${adminPasswordHash}`);
    
    // Update the admin user directly in MongoDB to bypass any pre-save hooks
    const updateResult = await User.updateOne(
      { email: adminEmail }, 
      { 
        $set: { 
          password: adminPasswordHash,
          isAdmin: true
        } 
      }
    );
    
    console.log(`Direct update result: ${JSON.stringify(updateResult)}`);
    
    // ===== STEP 2: Create a test user with direct MongoDB insert =====
    console.log("\nSTEP 2: Create a test user");
    
    // Test user credentials
    const testEmail = "tester@sunsetview.com";
    const testPassword = "Password@123";
    
    // First delete any existing test user to avoid conflicts
    await User.deleteOne({ email: testEmail });
    
    // Hash the test password
    const testPasswordHash = await bcrypt.hash(testPassword, 8);
    console.log(`Generated test password hash: ${testPasswordHash}`);
    
    // Create a new test user document
    const testUser = new User({
      email: testEmail,
      password: testPasswordHash,
      firstName: "Test",
      lastName: "Account",
      isAdmin: false
    });
    
    // Save the test user
    await testUser.save();
    console.log(`Test user created with email: ${testEmail}`);
    
    // ===== STEP 3: Verify both accounts can be authenticated =====
    console.log("\nSTEP 3: Verification tests");
    
    // Retrieve admin account
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log(`\nAdmin account found: ${adminUser.email}`);
      console.log(`Admin password hash: ${adminUser.password}`);
      
      // Test password verification manually
      const adminPassCheck = await bcrypt.compare(adminPassword, adminUser.password);
      console.log(`Admin password verification: ${adminPassCheck ? "SUCCESS" : "FAILED"}`);
      
      console.log(`\nAdmin login credentials:`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log(`ERROR: Admin account not found!`);
    }
    
    // Retrieve test account
    const testUserAccount = await User.findOne({ email: testEmail });
    
    if (testUserAccount) {
      console.log(`\nTest account found: ${testUserAccount.email}`);
      console.log(`Test password hash: ${testUserAccount.password}`);
      
      // Test password verification manually
      const testPassCheck = await bcrypt.compare(testPassword, testUserAccount.password);
      console.log(`Test password verification: ${testPassCheck ? "SUCCESS" : "FAILED"}`);
      
      console.log(`\nTest login credentials:`);
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    } else {
      console.log(`ERROR: Test account not found!`);
    }
    
    console.log("\nPassword reset complete. You should now be able to log in with these credentials.");
    
  } catch (error) {
    console.error('Error in password reset script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
resetPasswords();