// Import necessary modules
import express, { Request, Response } from "express";
import User from "../userModels/user"; // User Mongoose model
import jwt from "jsonwebtoken"; // For creating authentication tokens
import { body, validationResult } from 'express-validator'; // Middleware for validating incoming request bodies
import verifyToken from "../middleware/authRegister"; // Middleware to ensure user is authenticated
import crypto from 'crypto'; // For secure operations (not used directly here, but imported)

const router = express.Router(); // Create Express router instance

/**
 * @route   GET /api/users/user
 * @desc    Get the currently authenticated user's profile (excluding password)
 * @access  Private (requires valid token)
 */
router.get("/user", verifyToken, async (req: Request, res: Response): Promise<any> => {
  const userId = req.userId; // `userId` is extracted from the token by verifyToken middleware

  try {
    const user = await User.findById(userId).select("-password"); // Fetch user, exclude password field for safety

    if (!user) {
      return res.status(400).json({ message: "Not found" }); // User not found
    }

    res.json(user); // Return user profile
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/**
 * @route   POST /api/users/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post("/register", [
  // Validate incoming registration fields
  body("firstName", "First Name is required").isString(),
  body("lastName", "Last Name is required").isString(),
  body("email", "Valid Email is required").isEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
], async (req: Request, res: Response): Promise<any> => {
  try {
    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Return first error if validation fails
    }

    console.log("Incoming Registration Data:", req.body);

    // Check if a user with the given email already exists
    let user = await User.findOne({ email: req.body.email });

    console.log("Existing User Check:", user);

    if (user) {
      return res.status(400).json({ message: "Email already exists" }); // Prevent duplicate registration
    }

    // Create new user object
    user = new User({
      ...req.body, // Spread incoming data directly (assuming schema handles extra fields safely)
    });

    console.log("New User Object Created:", user);

    await user.save(); // Save new user to database
    console.log("New User Saved:", user);

    // Create a JWT token for the new user (immediate login)
    const token = jwt.sign(
      { userId: user.id }, // Payload inside token
      process.env.REACT_APP_JWT_SECRET_KEY as string, // Secret key (must exist in env variables)
      {
        expiresIn: "2d", // Token expires in 2 days
      }
    );

    // Set the token in a secure HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true, // Not accessible from frontend JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      maxAge: 172800000, // Cookie expiration time = 2 days in milliseconds
    });

    // Respond with the user's MongoDB ID
    return res.status(200).json({ userId: user._id });
  } catch (error) {
    console.error("Error in /register route:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Export the router so it can be mounted on /api/users path in server.ts
export default router;
