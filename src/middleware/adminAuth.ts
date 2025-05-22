// Import necessary types from Express and the User model
import { Request, Response, NextFunction } from "express";
import User from "../userModels/user";

/**
 * Middleware: verifyAdmin
 * 
 * Purpose:
 * - Ensure that a user accessing a protected route is authenticated (has a valid userId)
 * - AND that the user has admin privileges (isAdmin flag set to true)
 * 
 * If either check fails, access to the route is blocked.
 */
const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Step 1: Check if userId exists on the request
    // (userId should have been set earlier by verifyToken middleware)
    if (!req.userId) {
      console.log('Admin verification failed: No userId in request');
      res.status(401).json({ message: "Unauthorized" }); // No user logged in
      return;
    }
    
    console.log(`Verifying admin privileges for user: ${req.userId}`);
    
    // Step 2: Fetch user details from the database using userId
    const user = await User.findById(req.userId);
    
    // Step 3: If no user found, block access
    if (!user) {
      console.log(`Admin verification failed: User ${req.userId} not found`);
      res.status(403).json({ message: "Access denied: User not found" });
      return;
    }
    
    // Step 4: Check if user has admin rights
    if (!user.isAdmin) {
      console.log(`Admin verification failed: User ${req.userId} is not an admin (isAdmin: ${user.isAdmin})`);
      res.status(403).json({ message: "Access denied: Admin privileges required" });
      return;
    }
    
    // Step 5: If all checks pass, allow the request to continue
    console.log(`Admin verification successful: User ${req.userId} has admin privileges`);
    next();
  } catch (error) {
    // Step 6: Handle unexpected errors (like DB errors)
    console.error(`Admin verification error for user ${req.userId}:`, error);
    res.status(500).json({ message: "Server error during admin verification" });
  }
};

// Export the middleware for use in admin-protected routes
export default verifyAdmin;
