"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../userModels/user"));
const verifyAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user ID exists (set by verifyToken middleware)
        if (!req.userId) {
            console.log('Admin verification failed: No userId in request');
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        console.log(`Verifying admin privileges for user: ${req.userId}`);
        // Find the user and check admin status
        const user = yield user_1.default.findById(req.userId);
        if (!user) {
            console.log(`Admin verification failed: User ${req.userId} not found`);
            res.status(403).json({ message: "Access denied: User not found" });
            return;
        }
        if (!user.isAdmin) {
            console.log(`Admin verification failed: User ${req.userId} is not an admin (isAdmin: ${user.isAdmin})`);
            res.status(403).json({ message: "Access denied: Admin privileges required" });
            return;
        }
        console.log(`Admin verification successful: User ${req.userId} has admin privileges`);
        next();
    }
    catch (error) {
        console.error(`Admin verification error for user ${req.userId}:`, error);
        res.status(500).json({ message: "Server error during admin verification" });
    }
});
exports.default = verifyAdmin;
