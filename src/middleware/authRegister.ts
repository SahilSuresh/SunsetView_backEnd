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
    // List of public routes that don't require authentication
    const publicRoutes = [
        '/api/users/register',
        '/api/auth/login',
        '/api/password/forgot-password',
        '/api/password/validate-token',
        '/api/password/reset-password'
    ];

    // Skip token verification for public routes
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        next();
        return; // Just return without a value
    }
    
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