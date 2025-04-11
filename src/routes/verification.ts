import express, { Request, Response } from "express";
import crypto from 'crypto';
import User from "../userModels/user";
import { sendVerificationEmail } from "../services/emailService";

const router = express.Router();

// Verify email route
router.get("/:token", async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    
    console.log(`Processing verification for token: ${token.substring(0, 10)}...`);
    
    // Find user with the verification token
    const user = await User.findOne({
      verificationToken: token
    });

    if (!user) {
      console.log("Verification failed: Token not found");
      return res.status(400).json({ 
        message: "Invalid verification token" 
      });
    }

    // Check if token is expired
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      console.log("Verification failed: Token expired");
      return res.status(400).json({ 
        message: "Verification token has expired" 
      });
    }

    console.log(`Found user to verify: ${user.email}`);
    
    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    
    console.log(`User ${user.email} verified successfully`);

    return res.status(200).json({ 
      message: "Email verified successfully" 
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ 
      message: "Email verification failed" 
    });
  }
});

// Resend verification email
router.post("/resend", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    console.log(`Resending verification email to: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    // If already verified
    if (user.isVerified) {
      console.log(`Email already verified for: ${email}`);
      return res.status(400).json({ 
        message: "Email already verified" 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationExpires = tokenExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.firstName);
    console.log(`Verification email sent to: ${email}`);

    return res.status(200).json({ 
      message: "Verification email sent" 
    });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return res.status(500).json({ 
      message: "Failed to resend verification email" 
    });
  }
});

export default router;