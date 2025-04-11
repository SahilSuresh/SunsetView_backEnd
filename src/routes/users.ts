import express, {Request, Response} from "express";
import User from "../userModels/user";
import jwt from "jsonwebtoken";
import { body, validationResult } from 'express-validator';
import verifyToken from "../middleware/authRegister";
import crypto from 'crypto';

const router = express.Router();

router.get("/user", verifyToken, async(req:Request, res: Response): Promise<any>=> {
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(400).json({message: "Not found"});
        }
        res.json(user);

    } catch (error) {
        console.log(error);
        res.status(500).json({message: "something went wrong"});
    }
})

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
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log("Request Body:", req.body);

        let user = await User.findOne({
            email: req.body.email,
        });
        console.log("User Found:", user);

        if (user) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Create new user without verification fields
        user = new User({
            ...req.body
        });
        
        console.log("New User:", user);

        await user.save();
        console.log("User Saved:", user);

        // Create JWT token for immediate login
        const token = jwt.sign(
            { userId: user.id },
            process.env.REACT_APP_JWT_SECRET_KEY as string,
            {
                expiresIn: "2d",
            }
        );
        
        // Set authentication cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000, // 2 days
        });

        return res.status(200).json({ userId: user._id });
    } catch (e) {
        console.log("Error in /register route:", e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;