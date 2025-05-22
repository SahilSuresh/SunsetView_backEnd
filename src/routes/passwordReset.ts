// Import necessary modules
import express, { Request, Response } from "express";
import crypto from 'crypto'; // To generate secure random reset tokens
import User from "../userModels/user"; // User model
import { sendPasswordResetEmail } from "../services/emailService"; // Service to send reset emails
import bcrypt from "bcryptjs"; // For hashing passwords (optional here if used inside pre-save hooks)
import { body, validationResult } from "express-validator"; // Middleware for form validation

// Initialize Express Router
const router = express.Router();

/**
 * @route   POST /forgot-password
 * @desc    Initiate a password reset request
 * @access  Public
 */
router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("Valid email is required"), // Validate email format
  ],
  async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Return all validation errors
    }
    
    try {
      const { email } = req.body;
      
      // Find the user associated with this email
      const user = await User.findOne({ email });
      
      // Important security practice: 
      // Never reveal if email exists or not — prevents email enumeration attacks
      if (!user) {
        return res.status(200).json({ 
          message: "If an account exists, a password reset link has been sent"
        });
      }
      
      // Generate a secure random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // Token valid for 1 hour

      // Save token and expiry on user model
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
      
      // Send password reset email to the user
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);

      // Respond success even if user doesn't exist (for security consistency)
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

/**
 * @route   GET /validate-token/:token
 * @desc    Verify if a reset token is valid and not expired
 * @access  Public
 */
router.get("/validate-token/:token", async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    
    // Find user with the matching reset token AND ensure it's still valid (not expired)
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Expires must be in the future
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Password reset token is invalid or has expired" 
      });
    }

    // Token is valid
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

/**
 * @route   POST /reset-password/:token
 * @desc    Reset user's password using the valid token
 * @access  Public
 */
router.post(
  "/reset-password/:token",
  [
    // Validate new password according to strong security policies
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
      .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
      .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
    // Confirm password match
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
  ],
  async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Find user by reset token and ensure token is not expired
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          message: "Password reset token is invalid or has expired"
        });
      }

      // Update user's password
      user.password = password; // Assumes hashing is done in a pre-save hook on the User model
      user.resetPasswordToken = null; // Clear the reset token
      user.resetPasswordExpires = null; // Clear the expiration date
      await user.save(); // Save updated user

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

// Export the router
export default router;
