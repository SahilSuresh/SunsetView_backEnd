// Import necessary modules
import express from 'express'; // Main Express framework
import cors from 'cors'; // Middleware to allow requests from different origins
import 'dotenv/config'; // Load environment variables from a .env file into process.env
import mongoose from 'mongoose'; // Mongoose for interacting with MongoDB
import usersRoutes from './routes/users'; // User routes: register, fetch profile
import authRoutes from './routes/auth'; // Authentication routes: login, logout
import cookieParser from 'cookie-parser'; // Middleware to read cookies
import { v2 as cloundinary } from 'cloudinary'; // Cloudinary V2 for image uploads
import myHotelRoutes from './routes/my-hotels'; // User's own hotel management
import hotelRoutes from "./routes/hotels"; // Public browsing/searching of hotels
import hotelBookingRoutes from "./routes/my-bookings"; // User's personal bookings
import passwordResetRoutes from './routes/passwordReset'; // Password reset flows
import adminRoutes from './routes/admin'; // Admin routes (manage users, hotels, bookings)
import contactRoutes from './routes/contact'; // Contact form and cancellation messages

// ==============================
// Configure Cloudinary
// ==============================
// Before using Cloudinary uploads, configure with account credentials
cloundinary.config({
    cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.REACT_APP_CLOUDINARY_API_KEY as string,
    api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET as string,
});

// ==============================
// Connect to MongoDB
// ==============================
// Create an async function to connect to the MongoDB database
const connectDB = async () => {
    try {
      // Retrieve MongoDB connection string from environment variables
      const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING as string;

      // Connect to the database using Mongoose
      const conn = await mongoose.connect(connectionString);

      // If connection successful, log the connected database host
      console.log(`MongoDB Connected: ${conn.connection.host}`);

      // Output current environment (development/production/testing)
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Database: ${process.env.NODE_ENV === 'e2e' ? 'E2E Test Database' : 'Main Database'}`);
    } catch (error) {
      // If connection fails, log the error and exit the process
      console.error(`Error connecting to MongoDB: ${String(error)}`);
      process.exit(1); // Exit with failure
    }
};

// Call the connection function immediately when server starts
connectDB();

// ==============================
// Initialize the Express app
// ==============================

const app = express();

// ==============================
// Setup Middlewares
// ==============================

// Parse cookies from incoming HTTP requests
app.use(cookieParser());

// Parse JSON bodies (for API POST/PUT requests)
app.use(express.json());

// Parse URL-encoded form data (for traditional form submissions)
app.use(express.urlencoded({ extended: true }));

// Setup CORS (Cross-Origin Resource Sharing)
// Allows frontend (e.g., React app) to communicate with this backend
app.use(cors({
    origin: process.env.FRONTEND_URL, // Only allow requests from your frontend URL
    credentials: true, // Allow sending cookies with requests
}));

// ==============================
// Setup API routes
// ==============================

// Public route: handles password reset workflow (forgot password, validate token, reset password)
app.use("/api/password", passwordResetRoutes);

// Protected user routes: register, fetch user data
app.use("/api/users", usersRoutes);

// Authentication routes: login, logout, validate JWT token
app.use("/api/auth", authRoutes);

// Protected route: manage hotels created by the logged-in user
app.use("/api/my-hotels", myHotelRoutes);

// Public route: browse or search hotels (no login required)
app.use("/api/hotels", hotelRoutes);

// Protected route: manage bookings made by the logged-in user
app.use("/api/my-bookings", hotelBookingRoutes);

// Protected route: for admins only — dashboard stats, manage users/hotels/bookings
app.use("/api/admin", adminRoutes);

// Contact form routes (public or semi-protected): send messages or booking cancellations
app.use("/api/contact", contactRoutes);

// ==============================
// Start the Server
// ==============================
// Listen on port 3000 and handle incoming requests
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
