// Import mongoose for schema and model definition
import mongoose from "mongoose";
import { BookingType, HotelType } from "../share/type";

/**
 * Booking Schema
 * 
 * Defines the structure of a booking document embedded inside a hotel.
 * 
 * Important Notes:
 * - Bookings are stored as subdocuments inside their corresponding Hotel.
 * - Each booking saves a snapshot of user details at booking time (not just userId reference).
 * - Ensures historical accuracy even if user updates their account later.
 */
const bookingScheme = new mongoose.Schema<BookingType>({
    firstName: { type: String, required: true },         // Customer's first name
    lastName: { type: String, required: true },          // Customer's last name
    email: { type: String, required: true },             // Customer's email address
    adultCount: { type: Number, required: true },        // Number of adults for this booking
    childrenCount: { type: Number, required: true },     // Number of children for this booking
    checkIn: { type: Date, required: true },             // Check-in date
    checkOut: { type: Date, required: true },            // Check-out date
    userId: { type: String, required: true },            // ID of user who made the booking (reference to User)
    bookingTotalCost: { type: Number, required: true }   // Total price calculated at booking time
});

/**
 * Hotel Schema
 * 
 * Defines the structure of a hotel document in MongoDB.
 * 
 * Important Notes:
 * - userId ties the hotel to a specific hotel owner (multi-tenant system).
 * - Images are uploaded externally (e.g., Cloudinary) and only URLs are saved here.
 * - bookings is an embedded array of booking subdocuments (no separate Booking collection).
 */
const hotelSchema = new mongoose.Schema<HotelType>({
    userId: { type: String, required: true },             // Hotel owner's userId
    name: { type: String, required: true },               // Hotel name
    city: { type: String, required: true },               // City where the hotel is located
    country: { type: String, required: true },            // Country where the hotel is located
    description: { type: String, required: true },        // Detailed description of the hotel
    type: { type: String, required: true },               // Type of hotel (e.g., Resort, Hostel, Apartment)
    adultCount: { type: Number, required: true },         // Max number of adults allowed
    childrenCount: { type: Number, required: true },      // Max number of children allowed
    facilities: [{ type: String, required: true }],       // Array of available facilities (Wi-Fi, Parking, etc.)
    pricePerNight: { type: Number, required: true },      // Base price for one adult per night
    rating: { type: Number, required: true },             // Average user rating (1-5 scale)
    imageURL: [{ type: String, required: true }],         // Array of image URLs (uploaded to Cloudinary)
    lastUpdated: { type: Date, required: true },          // Timestamp of the last update to hotel info
    bookings: [bookingScheme],                            // Embedded array of bookings made for this hotel
});

/**
 * Hotel Model
 * 
 * Exports a reusable mongoose model to interact with the hotels collection.
 */
const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);

export default Hotel;
