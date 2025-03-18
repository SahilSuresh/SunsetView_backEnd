import express, { Request, Response } from "express";
import Hotel from "../userModels/hotel";
import { HotelQueryResponse } from "../share/type";

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const pageSize = 6; // each page will have 6 hotels
    const pageNum = parseInt(req.query.page ? req.query.page.toString() : "1"); 
    const skipHotel = (pageNum - 1) * pageSize; 

    // ADD THIS (around line 11-20):
    // Create a filter object for the search
    const filters: any = {};
    
    // Add destination filter if provided
    if (req.query.destination) {
      const destinationRegex = new RegExp(req.query.destination.toString(), 'i');
      filters.$or = [
        { name: { $regex: destinationRegex } },
        { city: { $regex: destinationRegex } },
        { country: { $regex: destinationRegex } }
      ];
    }
    
    // CHANGE THIS LINE (around line 22):
    const hotels = await Hotel.find(filters).skip(skipHotel).limit(pageSize); // Apply filters

    // CHANGE THIS LINE (around line 24):
    const totalHotels = await Hotel.countDocuments(filters); // Apply same filters here
    
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

export default router;