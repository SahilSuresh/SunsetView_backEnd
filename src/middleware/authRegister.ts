import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Extending Express Request interface to include userId
 * 
 * Purpose:
 * - After verifying the JWT, we want to store the `userId`
 *   inside `req.userId` so that all protected routes can access it easily.
 */
declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

/**
 * Middleware: verifyToken
 * 
 * Purpose:
 * - Verify the JWT token provided in cookies.
 * - Attach the authenticated user's ID to the request object.
 * - Allow certain routes to be publicly accessible without a token (e.g., login, registration, password reset).
 */
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    // List of public routes that don't require token verification
    const publicRoutes = [
        '/api/users/register',
        '/api/auth/login',
        '/api/password/forgot-password',
        '/api/password/validate-token',
        '/api/password/reset-password'
    ];

    // Check if current request path matches any public route
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        next(); // Allow request to continue without checking token
        return;
    }
    
    // Attempt to retrieve the auth token from cookies
    const token = req.cookies["auth_token"];
    
    // If no token found, immediately block access
    if (!token) {
        res.status(401).json({ message: "Unauthorised" });
        return;
    }
    
    try {
        // Verify token using the server's secret key
        const decoded = jwt.verify(token, process.env.REACT_APP_JWT_SECRET_KEY as string);

        // Successfully decoded token: attach userId to request
        req.userId = (decoded as JwtPayload).userId;

        // Allow request to move forward to protected route
        next();
    }
    catch (e) {
        // Token verification failed (expired, invalid, tampered, etc.)
        res.status(401).json({ message: "Unauthorised" });
        return;
    }
};

export default verifyToken;
