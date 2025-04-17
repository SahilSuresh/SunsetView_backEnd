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
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../userModels/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
//login endpoint
const router = express_1.default.Router();
router.post("/login", [
    (0, express_validator_1.body)("email", "Email is required").isEmail(),
    (0, express_validator_1.body)("password", "Password is required").isString(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log("Login validation errors:", errors.array());
        return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);
    try {
        // Find user
        console.log(`Looking up user with email: ${email}`);
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            console.log(`Login failed: User with email ${email} not found`);
            return res.status(400).json({ message: "Invalid email or password" });
        }
        console.log(`User found: ${user._id}`);
        console.log(`User details - firstName: ${user.firstName}, lastName: ${user.lastName}, isAdmin: ${user.isAdmin}`);
        // Compare passwords
        console.log(`Comparing password for user: ${email}`);
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Incorrect password for ${email}`);
            return res.status(400).json({ message: "Invalid email or password" });
        }
        console.log(`Password match successful for ${email}`);
        // Generate JWT token
        const secretKey = process.env.REACT_APP_JWT_SECRET_KEY;
        if (!secretKey) {
            console.error("JWT_SECRET_KEY not found in environment variables");
            return res.status(500).json({ message: "Server configuration error" });
        }
        console.log(`Generating JWT token for user: ${user._id}`);
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, secretKey, {
            expiresIn: "2d",
        });
        // Set cookie
        console.log(`Setting auth_token cookie for user: ${user._id}`);
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000,
        });
        // Include isAdmin flag in response for frontend to know if user is admin
        console.log(`Login successful for ${email} (isAdmin: ${user.isAdmin || false})`);
        console.log("Sending response with isAdmin flag:", user.isAdmin || false);
        res.status(200).json({
            userId: user._id,
            isAdmin: user.isAdmin || false
        });
    }
    catch (error) {
        console.error(`Login error for ${email}:`, error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
//validating token function
router.get("/validate-token", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Validating token for userId: ${req.userId}`);
        // Find user to check if they're an admin
        const user = yield user_1.default.findById(req.userId).select("isAdmin firstName lastName email");
        if (!user) {
            console.log(`Token validation failed: User with ID ${req.userId} not found`);
            return res.status(400).json({ message: "User not found" });
        }
        console.log(`Token validated for: ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`Admin status: ${user.isAdmin || false}`);
        // Include isAdmin status in the response
        res.status(200).send({
            userId: req.userId,
            isAdmin: user.isAdmin || false
        });
    }
    catch (error) {
        console.error("Error validating token:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
router.post("/logout", (req, res) => {
    res.cookie("auth_token", "", {
        //expires the token
        expires: new Date(0)
    });
    res.status(200).json({ message: "Logged out successfully" });
});
exports.default = router;
