"use strict";
// Update to index.ts - Add admin routes import and use
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cloudinary_1 = require("cloudinary");
const my_hotels_1 = __importDefault(require("./routes/my-hotels"));
const hotels_1 = __importDefault(require("./routes/hotels"));
const my_bookings_1 = __importDefault(require("./routes/my-bookings"));
const passwordReset_1 = __importDefault(require("./routes/passwordReset"));
const admin_1 = __importDefault(require("./routes/admin")); // Import admin routes
cloudinary_1.v2.config({
    cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
    api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
});
// Database connection
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to the appropriate database based on environment
        const connectionString = process.env.REACT_APP_MONGO_CONNECTION_STRING;
        const conn = yield mongoose_1.default.connect(connectionString);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Log environment info
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Database: ${process.env.NODE_ENV === 'e2e' ? 'E2E Test Database' : 'Main Database'}`);
    }
    catch (error) {
        console.error(`Error connecting to MongoDB: ${String(error)}`);
        process.exit(1);
    }
});
// Connect to database
connectDB();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
//Convert body of API request into json. So you do not need to handle it own your own.
app.use(express_1.default.json());
// helps pass the website URL
app.use(express_1.default.urlencoded({ extended: true }));
//Security to prevent certain request from certain URL
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
// Password reset route
app.use("/api/password", passwordReset_1.default);
// Routes that require authentication token check
app.use("/api/users", users_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/my-hotels", my_hotels_1.default);
app.use("/api/hotels", hotels_1.default);
app.use("/api/my-bookings", my_bookings_1.default);
// Admin routes
app.use("/api/admin", admin_1.default);
//Start the server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
