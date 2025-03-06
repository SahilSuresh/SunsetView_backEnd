import mongoose from "mongoose";
import bcrypt from "bcryptjs"

// Define the UserType interface to represent the structure of a user document
export type UserType = {
    _id: string; // Unique identifier for the user
    email: string; // User's email address
    password: string; // User's password (should be hashed in a real-world scenario)
    firstName: string; // User's first name
    lastName: string; // User's last name
};

// Define the user schema using mongoose.Schema
const userSchema = new mongoose.Schema({
    email: { 
        type: String, // Data type is String
        required: true, // This field is required
        unique: true // Ensures that no two users can have the same email
    },
    password: { 
        type: String, // Data type is String
        required: true // This field is required
    },
    firstName: { 
        type: String, // Data type is String
        required: true // This field is required
    },
    lastName: { 
        type: String, // Data type is String
        required: true // This field is required
    },
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (typeof this.password === "string") {
            this.password = await bcrypt.hash(this.password, 8);
        } else {
            throw new Error("Password must be a string");
        }
    }
    next();
});

// Create a mongoose model for the User using the userSchema
// The model is named "User" and will be associated with the UserType interface
const User = mongoose.model<UserType>("User", userSchema);

//export statement
export default User;