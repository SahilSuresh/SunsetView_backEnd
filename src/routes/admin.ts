// routes/admin.ts

/**
 * Admin Routes
 * 
 * Purpose:
 * - Allow authenticated admins to view system data and manage users and hotels.
 * 
 * Protection:
 * - Every route here is protected by two middlewares:
 *    1. verifyToken → ensures user is logged in (token is valid)
 *    2. verifyAdmin → ensures user has admin privileges
 */

import express, { Request, Response } from "express";
import verifyToken from "../middleware/authRegister"; // Verify if the user is logged in
import verifyAdmin from "../middleware/adminAuth";    // Verify if the user is an admin
import User from "../userModels/user";                // Mongoose User model
import Hotel from "../userModels/hotel";              // Mongoose Hotel model
import { BookingType } from "../share/type";          // Shared Booking type

// Extended Booking Type to include hotel info (for admin viewing)
type BookingWithHotel = BookingType & {
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelId: string;
};

// Create Express router
const router = express.Router();

// Apply verifyToken and verifyAdmin to ALL routes
router.use(verifyToken, verifyAdmin);

/**
 * @route   GET /admin/dashboard
 * @desc    Admin dashboard stats: total users, hotels, bookings, revenue
 * @access  Admin Only
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    // Step 1: Count users
    const totalUsers = await User.countDocuments();

    // Step 2: Count hotels
    const totalHotels = await Hotel.countDocuments();
    
    // Step 3: Count bookings and calculate recent bookings
    const hotelsWithBookings = await Hotel.find({}, { bookings: 1 }); // Only fetch bookings field

    const totalBookings = hotelsWithBookings.reduce((total, hotel) => {
      return total + (hotel.bookings ? hotel.bookings.length : 0);
    }, 0);

    // Step 4: Calculate recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentBookings = 0;
    hotelsWithBookings.forEach(hotel => {
      if (hotel.bookings) {
        hotel.bookings.forEach(booking => {
          if (new Date(booking.checkIn) >= thirtyDaysAgo) {
            recentBookings++;
          }
        });
      }
    });

    // Step 5: Calculate total revenue
    let totalRevenue = 0;
    hotelsWithBookings.forEach(hotel => {
      if (hotel.bookings) {
        hotel.bookings.forEach(booking => {
          totalRevenue += booking.bookingTotalCost || 0;
        });
      }
    });

    // Send aggregated dashboard stats
    res.json({
      totalUsers,
      totalHotels,
      totalBookings,
      recentBookings,
      totalRevenue
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Error fetching admin dashboard stats" });
  }
});

/**
 * @route   GET /admin/users
 * @desc    Get all users (excluding passwords)
 * @access  Admin Only
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    // Find all users but do not return password field
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/**
 * @route   GET /admin/hotels
 * @desc    Get all hotels (with booking counts)
 * @access  Admin Only
 */
router.get("/hotels", async (req: Request, res: Response) => {
  try {
    // Fetch hotels with selected fields
    const hotels = await Hotel.find().select("name city country userId rating pricePerNight bookings");

    // Process hotels: remove bookings array but add bookingCount
    const hotelsWithBookingCounts = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      const bookingCount = hotel.bookings ? hotel.bookings.length : 0;
      const { bookings, ...hotelWithoutBookings } = hotelObj;
      return {
        ...hotelWithoutBookings,
        bookingCount
      };
    });

    res.json(hotelsWithBookingCounts);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

/**
 * @route   GET /admin/bookings
 * @desc    Get all bookings across all hotels with hotel info
 * @access  Admin Only
 */
router.get("/bookings", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ "bookings.0": { $exists: true } }).select("name city country bookings");

    // Flatten bookings into a single array with hotel metadata attached
    const bookings: BookingWithHotel[] = [];

    hotels.forEach(hotel => {
      if (hotel.bookings) {
        hotel.bookings.forEach(booking => {
          const bookingWithHotel: BookingWithHotel = {
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
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

/**
 * @route   DELETE /admin/users/:userId
 * @desc    Delete a specific user by ID (Admin cannot delete themselves)
 * @access  Admin Only
 */
router.delete("/users/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.params.userId;

    // Block admin from accidentally deleting their own account
    if (userId === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

/**
 * @route   GET /admin/hotels/:hotelId
 * @desc    Get full details of a specific hotel
 * @access  Admin Only
 */
router.get("/hotels/:hotelId", async (req: Request, res: Response): Promise<any> => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ message: "Error fetching hotel" });
  }
});

/**
 * @route   DELETE /admin/hotels/:hotelId
 * @desc    Delete a hotel by ID (return info if it had bookings)
 * @access  Admin Only
 */
router.delete("/hotels/:hotelId", async (req: Request, res: Response): Promise<any> => {
  try {
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const hasBookings = hotel.bookings && hotel.bookings.length > 0;

    await Hotel.findByIdAndDelete(hotelId);

    res.json({ 
      message: "Hotel deleted successfully",
      hadBookings: hasBookings
    });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ message: "Error deleting hotel" });
  }
});

// Export the router for use in app.ts/server.ts
export default router;
