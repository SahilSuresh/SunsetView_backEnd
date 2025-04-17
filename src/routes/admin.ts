// routes/admin.ts

import express, { Request, Response } from "express";
import verifyToken from "../middleware/authRegister";
import verifyAdmin from "../middleware/adminAuth";
import User from "../userModels/user";
import Hotel from "../userModels/hotel";
import { BookingType } from "../share/type";

// Define an extended booking type with hotel info
type BookingWithHotel = BookingType & {
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelId: string;
};

const router = express.Router();

// All routes here require both authentication and admin privileges
router.use(verifyToken, verifyAdmin);

// Get dashboard stats
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    // Count total users, hotels, and bookings
    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    
    // Calculate total bookings across all hotels
    const hotelsWithBookings = await Hotel.find({}, { bookings: 1 });
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
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Error fetching admin dashboard stats" });
  }
});

// Get all users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get all hotels with summary information
router.get("/hotels", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().select("name city country userId rating pricePerNight bookings");
    
    // Add booking counts to each hotel
    const hotelsWithBookingCounts = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      const bookingCount = hotel.bookings ? hotel.bookings.length : 0;
      
      // Create a new object without the bookings property
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

// Get all bookings across all hotels
router.get("/bookings", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ "bookings.0": { $exists: true } })
                              .select("name city country bookings");
    
    // Flatten the bookings array with hotel information
    const bookings: BookingWithHotel[] = [];
    
    hotels.forEach(hotel => {
      if (hotel.bookings && hotel.bookings.length > 0) {
        hotel.bookings.forEach(booking => {
          // Instead of calling toObject(), create a plain object
          // We take all properties from the BookingType and add our new properties
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
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Delete a user (careful with this one)
router.delete("/users/:userId", async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.params.userId;
    
    // Don't allow deletion of the current admin
    if (userId === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Get a single hotel with full details
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

export default router;





// Delete a hotel
router.delete("/hotels/:hotelId", async (req: Request, res: Response): Promise<any> => {
    try {
      const hotelId = req.params.hotelId;
      
      // Check if hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      
      // Check if hotel has bookings
      const hasBookings = hotel.bookings && hotel.bookings.length > 0;
      
      // Delete the hotel
      await Hotel.findByIdAndDelete(hotelId);
      
      // Return success message
      res.json({ 
        message: "Hotel deleted successfully",
        hadBookings: hasBookings
      });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ message: "Error deleting hotel" });
    }
  });