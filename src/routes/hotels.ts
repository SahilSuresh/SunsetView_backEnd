// routes/hotel.ts

/**
 * Hotel and Booking Routes
 * 
 * Handles:
 * - Searching for hotels (with multiple filters, sorting, pagination)
 * - Listing all hotels
 * - Viewing a single hotel's details
 * - Stripe payment integration for booking
 * - Booking creation after successful payment
 */

import express, { Request, Response } from "express";
import Hotel from "../userModels/hotel";
import { BookingType, HotelQueryResponse } from "../share/type";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/authRegister";
import mongoose from "mongoose";
import { sendBookingConfirmationEmail } from "../services/emailService";

// Initialize Stripe with secret key from environment variables
const stripeInstance = new Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY as string);

const router = express.Router();

/**
 * @route   GET /hotels/search
 * @desc    Search hotels with optional filters and pagination
 * @access  Public
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const pageSize = 6; // Max hotels per page
    const pageNum = parseInt(req.query.page ? req.query.page.toString() : "1");
    const skipHotel = (pageNum - 1) * pageSize; // How many hotels to skip

    const filters: any = {}; // Object to dynamically build MongoDB query filters

    // Destination search (matches hotel name, city, or country)
    if (req.query.destination) {
      const destinationRegex = new RegExp(req.query.destination.toString(), "i"); // case-insensitive regex
      filters.$or = [
        { name: { $regex: destinationRegex } },
        { city: { $regex: destinationRegex } },
        { country: { $regex: destinationRegex } },
      ];
    }

    // Rating filter (can select multiple ratings)
    if (req.query.rating) {
      const ratings = Array.isArray(req.query.rating)
        ? req.query.rating.map(r => parseInt(r.toString()))
        : [parseInt(req.query.rating.toString())];
      filters.rating = { $in: ratings };
    }

    // Filter by hotel type (eg: Apartment, Resort, etc.)
    if (req.query.type) {
      filters.type = req.query.type.toString();
    }

    // Facilities filter (eg: wifi, pool, parking)
    if (req.query.facilities) {
      const facilitiesArray = Array.isArray(req.query.facilities)
        ? req.query.facilities
        : [req.query.facilities];
      filters.facilities = { $all: facilitiesArray }; // Must include all selected facilities
    }

    // Sorting hotels
    let sortOptions = {};
    if (req.query.sortOption) {
      switch (req.query.sortOption.toString()) {
        case "ratingHighToLow":
          sortOptions = { rating: -1 }; // Higher ratings first
          break;
        case "pricePerNightLowToHigh":
          sortOptions = { pricePerNight: 1 }; // Lower prices first
          break;
        case "pricePerNightHighToLow":
          sortOptions = { pricePerNight: -1 }; // Higher prices first
          break;
        default:
          sortOptions = { lastUpdated: -1 }; // Latest updated first
      }
    } else {
      sortOptions = { lastUpdated: -1 };
    }

    // Fetch hotels with filters, sort, and pagination
    const hotels = await Hotel.find(filters)
      .sort(sortOptions)
      .skip(skipHotel)
      .limit(pageSize);

    // Count total hotels matching filters (for pagination)
    const totalHotels = await Hotel.countDocuments(filters);

    // Structure response
    const response: HotelQueryResponse = {
      data: hotels,
      pagination: {
        totalHotels,
        page: pageNum,
        pages: Math.ceil(totalHotels / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error getting hotels" });
  }
});

/**
 * @route   GET /hotels/
 * @desc    Get all hotels without filters (for homepage or full listing)
 * @access  Public
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().sort("-lastUpdated"); // Latest updated hotels first
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error getting hotels" });
  }
});

/**
 * @route   GET /hotels/:id
 * @desc    Get detailed information of a single hotel by ID
 * @access  Public
 */
router.get("/:id", [
  param("id").notEmpty().withMessage("Hotel ID is required"), // Validate that ID param exists
], async (req: Request, res: Response): Promise<any> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const id = req.params.id.toString();

  try {
    const hotel = await Hotel.findById(id); // Fetch hotel by MongoDB _id
    res.json(hotel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @route   POST /hotels/:hotelId/bookings/payment-intent
 * @desc    Create a Stripe payment intent before booking
 * @access  Private (Requires login)
 */
router.post("/:hotelId/bookings/payment-intent", verifyToken, async (req: Request, res: Response): Promise<any> => {
  const { numberOfNight, adultCount, childrenCount } = req.body;
  const hotelId = req.params.hotelId;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(400).json({ message: "Hotel not found" });
  }

  // Calculate total booking cost based on number of adults, children, and nights
  const adultCost = hotel.pricePerNight * parseInt(adultCount) * parseInt(numberOfNight);
  const childrenCost = (hotel.pricePerNight / 2) * parseInt(childrenCount) * parseInt(numberOfNight);
  const bookingTotalCost = adultCost + childrenCost;

  // Create Stripe PaymentIntent
  const paymentIntent = await stripeInstance.paymentIntents.create({
    amount: Math.round(bookingTotalCost * 100), // Stripe works in cents
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

  res.send({
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret.toString(),
    bookingTotalCost,
  });
});

/**
 * @route   POST /hotels/:hotelId/bookings
 * @desc    Finalize booking after Stripe payment confirmation
 * @access  Private
 */
router.post("/:hotelId/bookings", verifyToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const paymentIntentId = req.body.paymentIntentId;

    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId as string);

    if (!paymentIntent) {
      return res.status(400).json({ message: "Payment not found" });
    }

    // Confirm payment matches correct hotel and user
    if (paymentIntent.metadata.hotelId !== req.params.hotelId || paymentIntent.metadata.userId !== req.userId) {
      return res.status(400).json({ message: "Payment intent mismatch" });
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment failed" });
    }

    // Create new booking object
    const newReservation: BookingType = {
      ...req.body,
      userId: req.userId,
      _id: new mongoose.Types.ObjectId().toString(), // Proper MongoDB _id
    };

    // Save booking to the hotel
    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.hotelId },
      { $push: { bookings: newReservation } },
      { new: true } // Return updated document
    );

    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    // Attempt to send booking confirmation email
    try {
      const addedBooking = hotel.bookings[hotel.bookings.length - 1];
      await sendBookingConfirmationEmail(addedBooking, hotel);
      console.log("Booking confirmation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
      // Booking is still successful even if email fails
    }

    res.status(200).json({
      message: "Booking created successfully",
      bookingId: newReservation._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
