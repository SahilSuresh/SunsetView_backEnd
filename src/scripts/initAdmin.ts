// scripts/initAdmin.ts

import mongoose from 'mongoose';
import User from "../userModels/user";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const initializeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.REACT_APP_MONGO_CONNECTION_STRING as string);
        console.log('Connected to MongoDB for admin initialization');

        // Check if admin environment variables are set
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
        const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

        if (!adminEmail || !adminPassword) {
            console.error('Admin credentials not found in environment variables');
            process.exit(1);
        }

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            // Update admin status if needed
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true;
                await existingAdmin.save();
                console.log(`Updated user ${adminEmail} to admin status`);
            } else {
                console.log(`Admin user ${adminEmail} already exists`);
            }
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 8);
            
            const newAdmin = new User({
                email: adminEmail,
                password: hashedPassword, // Already hashed, won't trigger pre-save hook
                firstName: adminFirstName,
                lastName: adminLastName,
                isAdmin: true
            });
            
            await newAdmin.save();
            console.log(`Created admin user with email: ${adminEmail}`);
        }
        
        console.log('Admin initialization complete');
    } catch (error) {
        console.error('Error initializing admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the initialization
initializeAdmin();