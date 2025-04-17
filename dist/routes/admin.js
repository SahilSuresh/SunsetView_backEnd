"use strict";
// routes/admin.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
const adminAuth_1 = __importDefault(require("../middleware/adminAuth"));
const user_1 = __importDefault(require("../userModels/user"));
const hotel_1 = __importDefault(require("../userModels/hotel"));
const router = express_1.default.Router();
// All routes here require both authentication and admin privileges
router.use(authRegister_1.default, adminAuth_1.default);
// Get dashboard stats
router.get("/dashboard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Count total users, hotels, and bookings
        const totalUsers = yield user_1.default.countDocuments();
        const totalHotels = yield hotel_1.default.countDocuments();
        // Calculate total bookings across all hotels
        const hotelsWithBookings = yield hotel_1.default.find({}, { bookings: 1 });
        const totalBookings = hotelsWithBookings.reduce((total, hotel) => {
            return total + (hotel.bookings ? hotel.bookings.length : 0);
        }, 0);
        // Calculate recent bookings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentBookings = 0;
        hotelsWithBookings.forEach(hotel => {
            if (hotel.bookings && hotel.bookings.length > 0) {
                hotel.bookings.forEach(booking => {
                    if (new Date(booking.checkIn) >= thirtyDaysAgo) {
                        recentBookings++;
                    }
                });
            }
        });
        // Calculate total revenue
        let totalRevenue = 0;
        hotelsWithBookings.forEach(hotel => {
            if (hotel.bookings && hotel.bookings.length > 0) {
                hotel.bookings.forEach(booking => {
                    totalRevenue += booking.bookingTotalCost || 0;
                });
            }
        });
        // Return dashboard stats
        res.json({
            totalUsers,
            totalHotels,
            totalBookings,
            recentBookings,
            totalRevenue
        });
    }
    catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({ message: "Error fetching admin dashboard stats" });
    }
}));
// Get all users
router.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find().select("-password");
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
}));
// Get all hotels with summary information
router.get("/hotels", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find().select("name city country userId rating pricePerNight bookings");
        // Add booking counts to each hotel
        const hotelsWithBookingCounts = hotels.map(hotel => {
            const hotelObj = hotel.toObject();
            const bookingCount = hotel.bookings ? hotel.bookings.length : 0;
            // Create a new object without the bookings property
            const { bookings } = hotelObj, hotelWithoutBookings = __rest(hotelObj, ["bookings"]);
            return Object.assign(Object.assign({}, hotelWithoutBookings), { bookingCount });
        });
        res.json(hotelsWithBookingCounts);
    }
    catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
// Get all bookings across all hotels
router.get("/bookings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ "bookings.0": { $exists: true } })
            .select("name city country bookings");
        // Flatten the bookings array with hotel information
        const bookings = [];
        hotels.forEach(hotel => {
            if (hotel.bookings && hotel.bookings.length > 0) {
                hotel.bookings.forEach(booking => {
                    // Instead of calling toObject(), create a plain object
                    // We take all properties from the BookingType and add our new properties
                    const bookingWithHotel = {
                        _id: booking._id,
                        userId: booking.userId,
                        firstName: booking.firstName,
                        lastName: booking.lastName,
                        email: booking.email,
                        adultCount: booking.adultCount,
                        childrenCount: booking.childrenCount,
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        bookingTotalCost: booking.bookingTotalCost,
                        // Add hotel information
                        hotelName: hotel.name,
                        hotelCity: hotel.city,
                        hotelCountry: hotel.country,
                        hotelId: hotel._id.toString()
                    };
                    bookings.push(bookingWithHotel);
                });
            }
        });
        res.json(bookings);
    }
    catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
}));
// Delete a user (careful with this one)
router.delete("/users/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        // Don't allow deletion of the current admin
        if (userId === req.userId) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }
        // Check if user exists
        const user = yield user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Delete the user
        yield user_1.default.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user" });
    }
}));
// Get a single hotel with full details
router.get("/hotels/:hotelId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = req.params.hotelId;
        const hotel = yield hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.json(hotel);
    }
    catch (error) {
        console.error("Error fetching hotel:", error);
        res.status(500).json({ message: "Error fetching hotel" });
    }
}));
exports.default = router;
