import express, { Request, Response } from "express";
import Hotel from "../userModels/hotel";
import { BookingType, HotelQueryResponse } from "../share/type";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/authRegister";
import { promises } from "dns";

const stripeInstance = new Stripe(
  process.env.REACT_APP_STRIPE_SECRET_KEY as string
);
const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const pageSize = 6; // each page will have 6 hotels
    const pageNum = parseInt(req.query.page ? req.query.page.toString() : "1");
    const skipHotel = (pageNum - 1) * pageSize;

    // Create a filter object for the search
    const filters: any = {};

    // Add destination filter if provided
    if (req.query.destination) {
      const destinationRegex = new RegExp(
        req.query.destination.toString(),
        "i"
      );
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
    } else {
      // Default sort by last updated
      sortOptions = { lastUpdated: -1 };
    }

    // Apply filters, sorting, and pagination
    const hotels = await Hotel.find(filters)
      .sort(sortOptions)
      .skip(skipHotel)
      .limit(pageSize);

    // Count total matching hotels with the same filters
    const totalHotels = await Hotel.countDocuments(filters);

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

//home page. 
router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().sort("-lastUpdated"); 
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error getting hotels" });
  }
})
//so anything request that goes to apu/hotels/ whatever the hotel Id is going to handle by this get request.
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const id = req.params.id.toString();

    try {
      const hotel = await Hotel.findById(id); //find the hotel we want by ID
      res.json(hotel);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response): Promise<any> => {
    const { numberOfNight, adultCount, childrenCount } = req.body;
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    // Calculate cost based on adults and children
    const adultCost = hotel.pricePerNight * parseInt(adultCount) * parseInt(numberOfNight);
    const childrenCost = (hotel.pricePerNight / 2) * parseInt(childrenCount) * parseInt(numberOfNight);
    const bookingTotalCost = adultCost + childrenCost;

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(bookingTotalCost * 100), // Stripe requires the amount in cents, rounded to avoid decimal issues
      currency: "gbp",
      metadata: {
        hotelId,
        userId: req.userId,
        adultCount,
        childrenCount,
        numberOfNight
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
  }
);

router.post(
  "/:hotelId/bookings",
  verifyToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const paymentIntentId = req.body.paymentIntentId;
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(
        paymentIntentId as string
      );

      if (!paymentIntent) {
        return res.status(400).json({ message: "payment not found" });
      }

      if (
        paymentIntent.metadata.hotelId !== req.params.hotelId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "payment intent mismatch" });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "payment failed" });
      }

      const newReservation: BookingType = {
        ...req.body,
        userId: req.userId,
      };

      const hotel = await Hotel.findOneAndUpdate(
        { _id: req.params.hotelId },
        {
          $push: { bookings: newReservation },
        }
      );

      if(!hotel) {
        return res.status(400).json({message: "hotel not found"});
      }
      
      await hotel.save();  
      
      res.status(200).send();
      
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;