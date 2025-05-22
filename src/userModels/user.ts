// Import Mongoose for schema creation and Bcrypt for password hashing
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../share/type"; // Import shared types for strong typing


/**
 * Mongoose Schema Definition for User
 * 
 * Defines how user documents are structured in MongoDB.
 */
const userSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true,
        unique: true // Ensures no two users have the same email
    },
    password: { 
        type: String,
        required: true // Password is mandatory at registration
    },
    firstName: { 
        type: String,
        required: true // First name is mandatory
    },
    lastName: { 
        type: String,
        required: true // Last name is mandatory
    },
    resetPasswordToken: {
        type: String,
        default: null // Null unless user requests password reset
    },
    resetPasswordExpires: {
        type: Date,
        default: null // Null unless a reset request is pending
    },
    isAdmin: {
        type: Boolean,
        default: false // Regular users by default; can be promoted to admin manually
    }
});

/**
 * Pre-save Hook
 * 
 * Automatically hashes the user's password before saving it to the database.
 * 
 * Important Logic:
 * - It only hashes if the password field was modified.
 * - Prevents double-hashing if the password is already securely hashed (e.g., during update).
 * - Ensures passwords are consistently stored securely.
 */
userSchema.pre("save", async function (next) {
    // Only proceed if password was modified or this is a new user
    if (this.isModified("password")) {
        try {
            // Avoid re-hashing already hashed passwords
            // Bcrypt hashed passwords typically start with $2a$ or $2b$
            if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
                if (typeof this.password === "string") {
                    console.log(`Hashing password for user: ${this.email}`);
                    this.password = await bcrypt.hash(this.password, 8); // 8 salt rounds
                } else {
                    throw new Error("Password must be a string");
                }
            } else {
                console.log(`Password already hashed for user: ${this.email}`);
            }
        } catch (error) {
            // Pass any error to Mongoose error handler
            return next(error as mongoose.CallbackError);
        }
    }
    // Continue with the save
    next();
});

/**
 * User Model
 * 
 * Exports a reusable Mongoose model to interact with the users collection.
 */
const User = mongoose.model<UserType>("User", userSchema);

export default User;
