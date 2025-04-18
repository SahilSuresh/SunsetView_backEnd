import express, {Request, Response} from "express";
import { body, validationResult } from 'express-validator';
import User from "../userModels/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/authRegister"

//login endpoint
const router = express.Router();

router.post("/login",[
    body("email", "Email is required").isEmail(),
    body("password", "Password is required").isString(),
], async (req: Request, res: Response): Promise<any> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log("Login validation errors:", errors.array());
        return res.status(400).json({ message: errors.array() })
    }

    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try{
        // Find user
        console.log(`Looking up user with email: ${email}`);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`Login failed: User with email ${email} not found`);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log(`User found: ${user._id}`);
        console.log(`User details - firstName: ${user.firstName}, lastName: ${user.lastName}, isAdmin: ${user.isAdmin}`);

        // Compare passwords
        console.log(`Comparing password for user: ${email}`);
        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch) {
            console.log(`Login failed: Incorrect password for ${email}`);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log(`Password match successful for ${email}`);

        // Generate JWT token
        const secretKey = process.env.REACT_APP_JWT_SECRET_KEY as string;
        if (!secretKey) {
            console.error("JWT_SECRET_KEY not found in environment variables");
            return res.status(500).json({ message: "Server configuration error" });
        }
        
        console.log(`Generating JWT token for user: ${user._id}`);
        const token = jwt.sign(
            { userId: user.id }, 
            secretKey, 
            { 
                expiresIn: "2d", 
            }
        );

        // Set cookie
        console.log(`Setting auth_token cookie for user: ${user._id}`);
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000,
        });

        // Include isAdmin flag in response for frontend to know if user is admin
        console.log(`Login successful for ${email} (isAdmin: ${user.isAdmin || false})`);
        console.log("Sending response with isAdmin flag:", user.isAdmin || false);
        
        res.status(200).json({
            userId: user._id,
            isAdmin: user.isAdmin || false
        });

    } catch (error) {
        console.error(`Login error for ${email}:`, error);
        res.status(500).json({message: "Something went wrong"});
    }
});

//validating token function
router.get("/validate-token", verifyToken, async (req:Request, res:Response):Promise<any> => {
    try {
        console.log(`Validating token for userId: ${req.userId}`);
        
        // Find user to check if they're an admin
        const user = await User.findById(req.userId).select("isAdmin firstName lastName email");
        
        if (!user) {
            console.log(`Token validation failed: User with ID ${req.userId} not found`);
            return res.status(400).json({message: "User not found"});
        }
        
        console.log(`Token validated for: ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`Admin status: ${user.isAdmin || false}`);
        
        // Include isAdmin status in the response
        res.status(200).send({
            userId: req.userId,
            isAdmin: user.isAdmin || false
        });
    } catch (error) {
        console.error("Error validating token:", error);
        res.status(500).json({message: "Something went wrong"});
    }
});

router.post("/logout", (req: Request, res: Response)=> {
    res.cookie("auth_token", "", {
        //expires the token
        expires: new Date(0)
    });
    res.status(200).json({message: "Logged out successfully"});
})

export default router;