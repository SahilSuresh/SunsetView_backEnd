import express from "express";
import { Request, Response } from "express";
import verifyToken from "../middleware/authRegister";
import Hotel from "../userModels/hotel"; // Adjust the path as per your project structure
import { HotelType } from "../share/type";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookedHotels = await Hotel.find({
      bookings: {
        $elemMatch: { userId: req.userId },
      },
    });

    const outcome = bookedHotels.map((hotel) => {
      //for each hotel only get the booking that belongs to the user
      const booking = hotel.bookings.filter(
        (booking) => booking.userId === req.userId
      ); 
      //above we done is created a new array of booking that belongs to the user
      const hotelWithUserBooking: HotelType = {
        ...hotel.toObject(), //convert the mongoose object to a plain object
        bookings: booking,
      }

      return hotelWithUserBooking; //return the hotel with the user booking

    });

    res.status(200).send(outcome);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});



export default router;