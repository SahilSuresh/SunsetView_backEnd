// routes/auth.ts

/**
 * Authentication Routes
 * 
 * Purpose:
 * - Allow users to log in securely using JWT tokens.
 * - Allow frontend to validate an active login session.
 * - Provide a logout endpoint to invalidate the user's token cookie.
 */

import express, { Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import User from "../userModels/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/authRegister";

// Create Express router instance
const router = express.Router();

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and generate JWT token
 * @access  Public
 */
router.post("/login", [
    // Validation for login fields
    body("email", "Email is required").isEmail(),
    body("password", "Password is required").isString(),
], async (req: Request, res: Response): Promise<any> => {
    // Handle validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Login validation errors:", errors.array());
        return res.status(400).json({ message: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try {
        // Step 1: Find the user by email
        console.log(`Looking up user with email: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`Login failed: User with email ${email} not found`);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log(`User found: ${user._id}`);

        // Step 2: Compare entered password with hashed password in database
        console.log(`Comparing password for user: ${email}`);
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`Login failed: Incorrect password for ${email}`);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log(`Password match successful for ${email}`);

        // Step 3: Verify JWT secret key exists
        const secretKey = process.env.REACT_APP_JWT_SECRET_KEY as string;
        if (!secretKey) {
            console.error("JWT_SECRET_KEY not found in environment variables");
            return res.status(500).json({ message: "Server configuration error" });
        }

        // Step 4: Generate a JWT token (userId embedded in payload, expires in 2 days)
        console.log(`Generating JWT token for user: ${user._id}`);
        const token = jwt.sign(
            { userId: user.id }, // Payload
            secretKey,           // Secret Key
            { expiresIn: "2d" }  // Token expiry
        );

        // Step 5: Set token in cookie (httpOnly for security)
        console.log(`Setting auth_token cookie for user: ${user._id}`);
        res.cookie("auth_token", token, {
            httpOnly: true, // JavaScript cannot access this cookie
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            maxAge: 172800000, // 2 days in milliseconds
        });

        // Step 6: Successful login response
        console.log(`Login successful for ${email} (isAdmin: ${user.isAdmin || false})`);
        res.status(200).json({
            userId: user._id,
            isAdmin: user.isAdmin || false
        });

    } catch (error) {
        console.error(`Login error for ${email}:`, error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

/**
 * @route   GET /auth/validate-token
 * @desc    Validate user's token and retrieve their basic information
 * @access  Private (requires a valid token)
 */
router.get("/validate-token", verifyToken, async (req: Request, res: Response): Promise<any> => {
    try {
        console.log(`Validating token for userId: ${req.userId}`);

        // Step 1: Find user using the userId extracted from token (done by verifyToken middleware)
        const user = await User.findById(req.userId).select("isAdmin firstName lastName email");

        if (!user) {
            console.log(`Token validation failed: User with ID ${req.userId} not found`);
            return res.status(400).json({ message: "User not found" });
        }

        console.log(`Token validated for: ${user.email} (${user.firstName} ${user.lastName})`);

        // Step 2: Send back basic info
        res.status(200).send({
            userId: req.userId,
            isAdmin: user.isAdmin || false
        });
    } catch (error) {
        console.error("Error validating token:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

/**
 * @route   POST /auth/logout
 * @desc    Clear the user's token to log them out
 * @access  Public
 */
router.post("/logout", (req: Request, res: Response) => {
    // Expire the auth_token cookie immediately
    res.cookie("auth_token", "", {
        expires: new Date(0)
    });
    res.status(200).json({ message: "Logged out successfully" });
});

// Export router
export default router;
