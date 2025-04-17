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
const hotel_1 = __importDefault(require("../userModels/hotel"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
const mongoose_1 = __importDefault(require("mongoose"));
const emailService_1 = require("../services/emailService");
const stripeInstance = new stripe_1.default(process.env.REACT_APP_STRIPE_SECRET_KEY);
const router = express_1.default.Router();
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageSize = 6; // each page will have 6 hotels
        const pageNum = parseInt(req.query.page ? req.query.page.toString() : "1");
        const skipHotel = (pageNum - 1) * pageSize;
        // Create a filter object for the search
        const filters = {};
        // Add destination filter if provided
        if (req.query.destination) {
            const destinationRegex = new RegExp(req.query.destination.toString(), "i");
            filters.$or = [
                { name: { $regex: destinationRegex } },
                { city: { $regex: destinationRegex } },
                { country: { $regex: destinationRegex } },
            ];
        }
        // Add rating filter if provided
        if (req.query.rating) {
            filters.rating = { $gte: parseInt(req.query.rating.toString()) };
        }
        // Add hotel type filter if provided
        if (req.query.type) {
            filters.type = req.query.type.toString();
        }
        // Add facilities filter if provided
        if (req.query.facilities) {
            // Handle both array and single string
            const facilitiesArray = Array.isArray(req.query.facilities)
                ? req.query.facilities
                : [req.query.facilities];
            // Make sure all selected facilities are included
            filters.facilities = { $all: facilitiesArray };
        }
        // Determine sort order
        let sortOptions = {};
        if (req.query.sortOption) {
            switch (req.query.sortOption.toString()) {
                case "ratingHighToLow":
                    sortOptions = { rating: -1 }; // -1 for descending
                    break;
                case "pricePerNightLowToHigh":
                    sortOptions = { pricePerNight: 1 }; // 1 for ascending
                    break;
                case "pricePerNightHighToLow":
                    sortOptions = { pricePerNight: -1 }; // -1 for descending
                    break;
                default:
                    // Default sort (by last updated)
                    sortOptions = { lastUpdated: -1 };
            }
        }
        else {
            // Default sort by last updated
            sortOptions = { lastUpdated: -1 };
        }
        // Apply filters, sorting, and pagination
        const hotels = yield hotel_1.default.find(filters)
            .sort(sortOptions)
            .skip(skipHotel)
            .limit(pageSize);
        // Count total matching hotels with the same filters
        const totalHotels = yield hotel_1.default.countDocuments(filters);
        const response = {
            data: hotels,
            pagination: {
                totalHotels,
                page: pageNum,
                pages: Math.ceil(totalHotels / pageSize),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Error getting hotels" });
    }
}));
// Home page - get all hotels
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find().sort("-lastUpdated");
        res.json(hotels);
    }
    catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Error getting hotels" });
    }
}));
// Get hotel by ID
router.get("/:id", [(0, express_validator_1.param)("id").notEmpty().withMessage("Hotel ID is required")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const id = req.params.id.toString();
    try {
        const hotel = yield hotel_1.default.findById(id); // Find the hotel we want by ID
        res.json(hotel);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// Create payment intent for booking
router.post("/:hotelId/bookings/payment-intent", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { numberOfNight, adultCount, childrenCount } = req.body;
    const hotelId = req.params.hotelId;
    const hotel = yield hotel_1.default.findById(hotelId);
    if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
    }
    // Calculate cost based on adults and children
    const adultCost = hotel.pricePerNight * parseInt(adultCount) * parseInt(numberOfNight);
    const childrenCost = (hotel.pricePerNight / 2) *
        parseInt(childrenCount) *
        parseInt(numberOfNight);
    const bookingTotalCost = adultCost + childrenCost;
    const paymentIntent = yield stripeInstance.paymentIntents.create({
        amount: Math.round(bookingTotalCost * 100), // Stripe requires the amount in cents, rounded to avoid decimal issues
        currency: "gbp",
        metadata: {
            hotelId,
            userId: req.userId,
            adultCount,
            childrenCount,
            numberOfNight,
        },
    });
    if (!paymentIntent.client_secret) {
        return res.status(400).json({ message: "Payment failed" });
    }
    const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret.toString(),
        bookingTotalCost,
    };
    res.send(response);
}));
// Create booking after successful payment
router.post("/:hotelId/bookings", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentIntentId = req.body.paymentIntentId;
        const paymentIntent = yield stripeInstance.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntent) {
            return res.status(400).json({ message: "Payment not found" });
        }
        if (paymentIntent.metadata.hotelId !== req.params.hotelId ||
            paymentIntent.metadata.userId !== req.userId) {
            return res.status(400).json({ message: "Payment intent mismatch" });
        }
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ message: "Payment failed" });
        }
        // Create new reservation with a proper MongoDB ID
        const newReservation = Object.assign(Object.assign({}, req.body), { userId: req.userId, _id: new mongoose_1.default.Types.ObjectId().toString() // Generate a proper MongoDB ID
         });
        // Find the hotel and update it with the new booking
        const hotel = yield hotel_1.default.findOneAndUpdate({ _id: req.params.hotelId }, {
            $push: { bookings: newReservation },
        }, { new: true } // Return the updated document
        );
        if (!hotel) {
            return res.status(400).json({ message: "Hotel not found" });
        }
        // Send booking confirmation email
        try {
            // Get the last booking (the one we just added)
            const addedBooking = hotel.bookings[hotel.bookings.length - 1];
            yield (0, emailService_1.sendBookingConfirmationEmail)(addedBooking, hotel);
            console.log("Booking confirmation email sent successfully");
        }
        catch (emailError) {
            // Don't fail the booking if email sending fails
            console.error("Failed to send booking confirmation email:", emailError);
        }
        res.status(200).json({
            message: "Booking created successfully",
            bookingId: newReservation._id
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;
