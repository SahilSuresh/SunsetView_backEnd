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
        return res.status(400).json({ message: errors.array() })
    }

    const { email, password } = req.body;

    try{
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        //a lot of more secure
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user.id }, 
            process.env.REACT_APP_JWT_SECRET_KEY as string, 
            { 
            expiresIn: "2d", 
            }
        );

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000,
        });

        res.status(200).json({userId: user._id});

    } catch (e) {
        console.log(e);
        res.status(500).json({message: "Something went wrong"});
    }
});

//validating token function
router.get("/validate-token", verifyToken, (req:Request, res:Response) => {
    res.status(200).send({userId: req.userId})
});

router.post("/logout", (req: Request, res: Response)=> {
    res.cookie("auth_token", "", {
        //expires the token
        expires: new Date(0)
    });
    res.status(200).json({message: "Logged out successfully"});
})

export default router;