import express, { Request, Response } from "express";
import crypto from 'crypto';
import User from "../userModels/user";
import { sendPasswordResetEmail } from "../services/emailService";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Request password reset
router.post("/forgot-password", 
  [
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  async (req: Request, res: Response):Promise<any> => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      
      // Don't reveal if user exists for security
      if (!user) {
        return res.status(200).json({ 
          message: "If an account exists, a password reset link has been sent" 
        });
      }
      
      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Update user with token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);
      
      return res.status(200).json({ 
        message: "If an account exists, a password reset link has been sent" 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      return res.status(500).json({ 
        message: "Failed to process password reset request" 
      });
    }
  }
);

// Verify reset token (before showing reset form)
router.get("/validate-token/:token", async (req: Request, res: Response):Promise<any> => {
  try {
    const { token } = req.params;
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
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
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({ 
      message: "Token validation failed" 
    });
  }
});

// Reset password
router.post("/reset-password/:token", 
  [
    body("password")
      .isLength({min: 8}).withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
      .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
      .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
  ],
  async (req: Request, res: Response):Promise<any> => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Find user with matching token that hasn't expired
      const user = await User.findOne({
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
      await user.save();
      
      return res.status(200).json({ 
        message: "Password has been reset" 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({ 
        message: "Failed to reset password" 
      });
    }
  }
);

export default router;