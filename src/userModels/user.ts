import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type UserType = {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isAdmin: boolean;
};

const userSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    firstName: { 
        type: String,
        required: true
    },
    lastName: { 
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

// THIS IS THE PROBLEMATIC PART - pre-save hook 
// is re-hashing already hashed passwords
userSchema.pre("save", async function (next) {
    // Only hash the password if it's been modified (or is new)
    if (this.isModified("password")) {
        try {
            // Check if the password is already hashed (starts with $2a$ or $2b$)
            if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
                if (typeof this.password === "string") {
                    console.log(`Hashing password for user: ${this.email}`);
                    this.password = await bcrypt.hash(this.password, 8);
                } else {
                    throw new Error("Password must be a string");
                }
            } else {
                console.log(`Password already hashed for user: ${this.email}`);
            }
        } catch (error) {
            return next(error as mongoose.CallbackError);
        }
    }
    next();
});

const User = mongoose.model<UserType>("User", userSchema);

export default User;