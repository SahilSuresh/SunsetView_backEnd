import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'


declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies["auth_token"];
    
    if (!token) {
        res.status(401).json({ message: "Unauthorised" });
        return; // Just return without a value
    }
    
    try {
        // to ensure that token is created by us
        const decoded = jwt.verify(token, process.env.REACT_APP_JWT_SECRET_KEY as string);
        req.userId = (decoded as JwtPayload).userId;
        next();
    }
    catch (e) {
        res.status(401).json({ message: "Unauthorised" });
        return; // Just return without a value
    }
};

export default verifyToken;


