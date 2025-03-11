import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import usersRoutes from './routes/users'
import authRoutes from './routes/auth'
import cookieParser from 'cookie-parser';
import { v2   as cloundinary } from 'cloudinary';
import myHotelRoutes from './routes/my-hotels';


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

app.use("/api/users", usersRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/my-hotels", myHotelRoutes);

//Start the server
app.listen(3000, () => {
    console.log("Sever running on https://localhost:3000");
    
});