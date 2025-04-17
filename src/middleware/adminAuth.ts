// middleware/adminAuth.ts
import { Request, Response, NextFunction } from "express";
import User from "../userModels/user";

const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user ID exists (set by verifyToken middleware)
    if (!req.userId) {
      console.log('Admin verification failed: No userId in request');
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    console.log(`Verifying admin privileges for user: ${req.userId}`);
    
    // Find the user and check admin status
    const user = await User.findById(req.userId);
    
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
  } catch (error) {
    console.error(`Admin verification error for user ${req.userId}:`, error);
    res.status(500).json({ message: "Server error during admin verification" });
  }
};

export default verifyAdmin;