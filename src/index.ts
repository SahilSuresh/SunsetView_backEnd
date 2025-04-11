import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import usersRoutes from './routes/users'
import authRoutes from './routes/auth'
import cookieParser from 'cookie-parser';
import { v2 as cloundinary } from 'cloudinary';
import myHotelRoutes from './routes/my-hotels';
import hotelRoutes from "./routes/hotels";
import hotelBookingRoutes from "./routes/my-bookings";
import passwordResetRoutes from './routes/passwordReset';

cloundinary.config({
    cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.REACT_APP_CLOUDINARY_API_KEY as string,
    api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET as string,
});

// Database connection
const connectDB = async () => {
    try {
      // Connect to the appropriate database based on environment
      const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING as string;
      const conn = await mongoose.connect(connectionString);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      
      // Log environment info
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Database: ${process.env.NODE_ENV === 'e2e' ? 'E2E Test Database' : 'Main Database'}`);
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${String(error)}`);
      process.exit(1);
    }
  };

// Connect to database
connectDB();

const app = express();
app.use(cookieParser());

//Convert body of API request into json. So you do not need to handle it own your own.
app.use(express.json());

// helps pass the website URL
app.use(express.urlencoded({extended: true}));

//Security to prevent certain request from certain URL
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// Password reset route (keep this)
app.use("/api/password", passwordResetRoutes);

// Routes that require authentication token check
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/my-hotels", myHotelRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/my-bookings", hotelBookingRoutes);

//Start the server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});