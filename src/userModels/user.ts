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
    }
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

const User = mongoose.model<UserType>("User", userSchema);

export default User;