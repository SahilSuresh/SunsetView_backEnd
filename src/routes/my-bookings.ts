// Import necessary modules
import express from "express";
import { Request, Response } from "express";
import verifyToken from "../middleware/authRegister"; // Middleware to verify logged-in users
import Hotel from "../userModels/hotel";              // Hotel model (adjust import path if needed)
import { HotelType } from "../share/type";             // Shared Hotel Type for strong typing

// Create Express Router
const router = express.Router();

/**
 * @route   GET /user/bookings
 * @desc    Get all hotels where the currently logged-in user has made a booking
 * @access  Private (Requires authentication)
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Step 1: Find all hotels where at least one booking matches the logged-in user
    const bookedHotels = await Hotel.find({
      bookings: {
        $elemMatch: { userId: req.userId }, // Check if bookings array contains a booking with user's ID
      },
    });

    // Step 2: Process each hotel to only include the specific booking(s) made by this user
    const outcome = bookedHotels.map((hotel) => {
      // For each hotel, filter bookings that belong only to the current user
      const booking = hotel.bookings.filter(
        (booking) => booking.userId === req.userId
      );

      // Step 3: Rebuild hotel object but only attach user's bookings
      const hotelWithUserBooking: HotelType = {
        ...hotel.toObject(), // Convert Mongoose document into a plain JavaScript object
        bookings: booking,   // Replace bookings array with only the user's bookings
      };

      return hotelWithUserBooking; // Add processed hotel to the outcome list
    });

    // Step 4: Return all hotels with user's bookings
    res.status(200).send(outcome);
  } catch (error) {
    // Step 5: Handle unexpected server errors
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export the router
export default router;
