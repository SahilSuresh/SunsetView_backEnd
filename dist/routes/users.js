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
const user_1 = __importDefault(require("../userModels/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
const router = express_1.default.Router();
router.get("/user", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const user = yield user_1.default.findById(userId).select("-password");
        if (!user) {
            return res.status(400).json({ message: "Not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
// /api/users/register
router.post("/register", [
    (0, express_validator_1.body)("firstName", "First Name is required").isString(),
    (0, express_validator_1.body)("lastName", "Last Name is required").isString(),
    (0, express_validator_1.body)("email", "Email is required").isEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least 1 number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least 1 special character"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        console.log("Request Body:", req.body);
        let user = yield user_1.default.findOne({
            email: req.body.email,
        });
        console.log("User Found:", user);
        if (user) {
            return res.status(400).json({ message: "Email already exists" });
        }
        // Create new user without verification fields
        user = new user_1.default(Object.assign({}, req.body));
        console.log("New User:", user);
        yield user.save();
        console.log("User Saved:", user);
        // Create JWT token for immediate login
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.REACT_APP_JWT_SECRET_KEY, {
            expiresIn: "2d",
        });
        // Set authentication cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 172800000, // 2 days
        });
        return res.status(200).json({ userId: user._id });
    }
    catch (e) {
        console.log("Error in /register route:", e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;
