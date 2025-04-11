import express, { Request, Response } from "express";
import multer from "multer";
import cloundinary from "cloudinary";
import Hotel from "../userModels/hotel";
import { HotelType } from "../share/type";
import verifyToken from "../middleware/authRegister";
import { body } from "express-validator";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 6 * 1024 * 1024, //6MB images
  },
});

//api/my-hotels
//make sure to use the same name on the frontEnd
router.post(
  "/",
  verifyToken,
  [
    //express validator to validate the form
    body("name").notEmpty().withMessage("Name is necessary"),
    body("city").notEmpty().withMessage("city is necessary"),
    body("country").notEmpty().withMessage("country is necessary"),
    body("description").notEmpty().withMessage("description is necessary"),
    body("type").notEmpty().withMessage("Hotel type is necessary"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Per per neight is required and must be number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are neccessary"),
  ],
  upload.array("imageURL", 8),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;

      //upload image to cloudinary
      const uploadImages = imageFiles.map(async (image) => {
        const base64String = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + base64String;
        const uploadImage = await cloundinary.v2.uploader.upload(dataURI);
        return uploadImage.secure_url;
      });

      const imageURL = await Promise.all(uploadImages);

      newHotel.imageURL = imageURL;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId; // more secure to get the user id from the token
      const hotel = new Hotel(newHotel); // saving it into newHote
      const saveHotel = await hotel.save(); // save it to the databse

      // Return success
      res.status(201).send(saveHotel);
    } catch (e) {
      console.log("Error creating hotel: ", e);
      res.status(500).json({ message: "Error creating hotel" });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error getting hotels" });
  }
});

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  // Whenveer we make the request random string express will take it as a parameter
  // and we can access it using req.params.id
  const id = req.params.id.toString();

  try {
    const hotel = await Hotel.findOne({ _id: id, userId: req.userId }); // the reason we use findOne is because we are looking for one hotel so we dont want users to be able to edit other users hotel
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error getting hotel" });
  }
});

router.put(
  "/:id",
  verifyToken,
  upload.array("imageURL", 8),
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id.toString();
    const imageFiles = req.files as Express.Multer.File[];
    const updatedHotel: HotelType = req.body;

    try {
      console.log("Request body:", req.body);
      console.log("Uploaded files:", imageFiles.length);
      
      // Find the original hotel
      const hotel = await Hotel.findOne({ _id: id, userId: req.userId });
      console.log("Original hotel images:", hotel?.imageURL);

      if (!hotel) {
        res.status(404).json({ message: "Hotel not found" });
        return;
      }

      // Upload new images to cloudinary
      const uploadImages = imageFiles.map(async (image) => {
        const base64String = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + base64String;
        const uploadImage = await cloundinary.v2.uploader.upload(dataURI);
        return uploadImage.secure_url;
      });

      const newImageURLs = await Promise.all(uploadImages);
      console.log("New image URLs:", newImageURLs);
      
      // IMPORTANT CHANGE: Keep the original images if not being explicitly replaced
      // Get existing images from the database instead of request body
      let finalImageURLs = [...hotel.imageURL];
      
      // Add new images
      if (newImageURLs.length > 0) {
        finalImageURLs = [...finalImageURLs, ...newImageURLs];
      }
      
      console.log("Final image URLs:", finalImageURLs);
      
      // Update with combined images
      updatedHotel.imageURL = finalImageURLs;
      updatedHotel.lastUpdated = new Date();
      updatedHotel.userId = req.userId;

      await hotel.updateOne(updatedHotel);
      res.json(updatedHotel);
    } catch (error) {
      console.error("Error updating hotel:", error);
      res.status(500).json({ message: "Error updating hotel" });
    }
  }
);

// New route to delete a specific image from a hotel
router.delete(
  "/:id/images",
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id.toString();
    const imageUrl = req.query.imageUrl as string;

    if (!imageUrl) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    try {
      // First, find the hotel
      const hotel = await Hotel.findOne({ _id: id, userId: req.userId });

      if (!hotel) {
        res.status(404).json({ message: "Hotel not found" });
        return;
      }

      // Filter out the image URL from the imageURL array
      const updatedImageURLs = hotel.imageURL.filter(
        (url: string) => url !== imageUrl
      );

      // Verify that the image was actually in the array
      if (updatedImageURLs.length === hotel.imageURL.length) {
        res.status(404).json({ message: "Image not found in hotel" });
        return;
      }

      // Update the hotel with the new image array
      hotel.imageURL = updatedImageURLs;
      hotel.lastUpdated = new Date();

      await hotel.save();

      // Delete the image from Cloudinary if needed
      try {
        // Extract public id from the URL (this depends on your Cloudinary URL structure)
        // Example: https://res.cloudinary.com/dqgooesfi/image/upload/v1111111111/abcdefgh.jpg
        // We need to extract "abcdefgh" as the public ID
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+?)\./);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        
        if (publicId) {
          await cloundinary.v2.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // We'll still return success since the DB was updated
      }

      res.status(200).json({ 
        message: "Image deleted successfully",
        updatedImageURLs 
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Error deleting image" });
    }
  }
);

// Add this route handler to your my-hotels.ts route file in the backend

// Get bookings for a specific hotel
router.get("/:id/bookings", verifyToken, async (req: Request, res: Response):Promise<any> => {
  const hotelId = req.params.id;
  const userId = req.userId;

  try {
    // Find the hotel that belongs to the user and has the specified ID
    const hotel = await Hotel.findOne({
      _id: hotelId,
      userId: userId
    });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or you don't have permission to view it" });
    }

    // Return the hotel with its bookings
    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ message: "Error fetching hotel bookings" });
  }
});

export default router;