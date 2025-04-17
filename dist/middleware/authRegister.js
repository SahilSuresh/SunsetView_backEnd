"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.REACT_APP_JWT_SECRET_KEY);
        req.userId = decoded.userId;
        next();
    }
    catch (e) {
        res.status(401).json({ message: "Unauthorised" });
        return; // Just return without a value
    }
};
exports.default = verifyToken;
