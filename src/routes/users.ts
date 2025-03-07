import express, {Request, Response} from "express";
import User from "../userModels/user";
import jwt from "jsonwebtoken";
import { body, validationResult } from 'express-validator';

const router = express.Router();

// /api/users/register
router.post("/register", [
    body("firstName", "First Name is required").isString(),
    body("lastName", "Last Name is required").isString(),
    body("email", "Email is required").isEmail(),
    body("password")
        .isLength({min: 8}).withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
], async (req: Request, res: Response): Promise<any> => {
    try {
        // Check for validation errors - keeping only this one instance
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log("Request Body:", req.body); // Log the request body

        let user = await User.findOne({
            email: req.body.email,
        });
        console.log("User Found:", user); // Log the user found in the database

        if (user) {
            return res.status(400).json({ message: "Email already exists" });
        }

        user = new User(req.body);
        console.log("New User:", user); // Log the new user object

        await user.save();
        console.log("User Saved:", user); // Log the saved user

        const token = jwt.sign(
            { userId: user.id },
            process.env.REACT_APP_JWT_SECRET_KEY as string,
            {
                expiresIn: "2d",
            }
        );
        console.log("Token Generated:", token); // Log the generated token

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000, // 2 days in milliseconds
        });
        console.log("Cookie Set"); // Log that the cookie was set

        return res.status(200).json({ message: "Registration successful", userId: user.id });
    } catch (e) {
        console.log("Error in /register route:", e); // Log the full error
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;