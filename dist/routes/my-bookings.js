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
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
const hotel_1 = __importDefault(require("../userModels/hotel")); // Adjust the path as per your project structure
const router = express_1.default.Router();
router.get("/", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookedHotels = yield hotel_1.default.find({
            bookings: {
                $elemMatch: { userId: req.userId },
            },
        });
        const outcome = bookedHotels.map((hotel) => {
            //for each hotel only get the booking that belongs to the user
            const booking = hotel.bookings.filter((booking) => booking.userId === req.userId);
            //above we done is created a new array of booking that belongs to the user
            const hotelWithUserBooking = Object.assign(Object.assign({}, hotel.toObject()), { bookings: booking });
            return hotelWithUserBooking; //return the hotel with the user booking
        });
        res.status(200).send(outcome);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.default = router;
