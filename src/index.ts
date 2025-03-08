import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import usersRoutes from './routes/users'
import authRoutes from './routes/auth'
import cookieParser from 'cookie-parser';
// dataconenction
const connectDB = async () => {
  try {
      const conn = await mongoose.connect(process.env.REACT_APP_MONGO_CONNECTION_STRING as string);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
      console.error(`Error connecting to MongoDB: ${String(error)}`);
      process.exit(1);
  }
};


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

//Start the server
app.listen(3000, () => {
    console.log("Sever running on https://localhost:3000");
    // connect to db
    connectDB();
});