"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
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
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only hash the password if it's been modified (or is new)
        if (this.isModified("password")) {
            try {
                // Check if the password is already hashed (starts with $2a$ or $2b$)
                if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
                    if (typeof this.password === "string") {
                        console.log(`Hashing password for user: ${this.email}`);
                        this.password = yield bcryptjs_1.default.hash(this.password, 8);
                    }
                    else {
                        throw new Error("Password must be a string");
                    }
                }
                else {
                    console.log(`Password already hashed for user: ${this.email}`);
                }
            }
            catch (error) {
                return next(error);
            }
        }
        next();
    });
});
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
