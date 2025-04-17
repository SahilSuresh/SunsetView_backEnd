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
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const user_1 = __importDefault(require("../userModels/user"));
const emailService_1 = require("../services/emailService");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Request password reset
router.post("/forgot-password", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.body;
        // Find user by email
        const user = yield user_1.default.findOne({ email });
        // Don't reveal if user exists for security
        if (!user) {
            return res.status(200).json({
                message: "If an account exists, a password reset link has been sent"
            });
        }
        // Generate password reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Update user with token
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        yield user.save();
        // Send password reset email
        yield (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken, user.firstName);
        return res.status(200).json({
            message: "If an account exists, a password reset link has been sent"
        });
    }
    catch (error) {
        console.error("Password reset request error:", error);
        return res.status(500).json({
            message: "Failed to process password reset request"
        });
    }
}));
// Verify reset token (before showing reset form)
router.get("/validate-token/:token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        // Find user with matching token that hasn't expired
        const user = yield user_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({
                message: "Password reset token is invalid or has expired"
            });
        }
        return res.status(200).json({
            message: "Token is valid"
        });
    }
    catch (error) {
        console.error("Token validation error:", error);
        return res.status(500).json({
            message: "Token validation failed"
        });
    }
}));
// Reset password
router.post("/reset-password/:token", [
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    })
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { token } = req.params;
        const { password } = req.body;
        // Find user with matching token that hasn't expired
        const user = yield user_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({
                message: "Password reset token is invalid or has expired"
            });
        }
        // Update password and clear reset token
        user.password = password; // Will be hashed by pre-save hook
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        yield user.save();
        return res.status(200).json({
            message: "Password has been reset"
        });
    }
    catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).json({
            message: "Failed to reset password"
        });
    }
}));
exports.default = router;
