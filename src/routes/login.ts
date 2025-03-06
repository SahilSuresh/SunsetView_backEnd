import express, {Request, Response} from "express";
import { body, validationResult } from 'express-validator';
import User from "../userModels/user";
import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/login",[ body("email", "Email is required").isEmail(),
    body("password")
        .isLength({min: 8}).withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
], async (req: Request, res: Response): Promise<any> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() })
    }

    const { email, password } = req.body;

    try{
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password)


    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Something went wrong"});
    }
});