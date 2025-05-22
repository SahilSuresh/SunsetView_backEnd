// Import required modules and libraries
import express, { Request, Response } from "express";
import multer from "multer"; // For handling multi-part form data (uploads)
import cloundinary from "cloudinary"; // For uploading images to Cloudinary
import Hotel from "../userModels/hotel"; // Hotel Mongoose model
import { HotelType } from "../share/type"; // Strong typing for hotel object
import verifyToken from "../middleware/authRegister"; // Middleware to verify if user is authenticated
import { body } from "express-validator"; // Library to validate incoming form data

// Initialize Express Router
const router = express.Router();

// Set up multer to temporarily store uploaded files in memory (RAM)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 6 * 1024 * 1024, // Limit upload size to 6MB per image to avoid server overload
  },
});

/**
 * @route   POST /api/my-hotels
 * @desc    Create a new hotel listing for the current authenticated user
 * @access  Private
 */
router.post(
  "/",
  verifyToken, // Require user to be logged in
  [
    // Validate form input fields
    body("name").notEmpty().withMessage("Name is necessary"),
    body("city").notEmpty().withMessage("City is necessary"),
    body("country").notEmpty().withMessage("Country is necessary"),
    body("description").notEmpty().withMessage("Description is necessary"),
    body("type").notEmpty().withMessage("Hotel type is necessary"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are necessary"),
  ],
  upload.array("imageURL", 8), // Accept up to 8 image uploads under the field name 'imageURL'
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[]; // Retrieve uploaded images
      const newHotel: HotelType = req.body; // Retrieve other hotel information

      // Upload each image to Cloudinary
      const uploadImages = imageFiles.map(async (image) => {
        const base64String = Buffer.from(image.buffer).toString("base64"); // Convert image buffer to base64
        const dataURI = "data:" + image.mimetype + ";base64," + base64String; // Create a data URI
        const uploadImage = await cloundinary.v2.uploader.upload(dataURI); // Upload image to Cloudinary
        return uploadImage.secure_url; // Only keep the secure URL after upload
      });

      // Wait for all images to finish uploading before proceeding
      const imageURL = await Promise.all(uploadImages);

      // Prepare hotel object with images and metadata
      newHotel.imageURL = imageURL;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId; // Associate hotel to the logged-in user securely

      // Save hotel to the database
      const hotel = new Hotel(newHotel);
      const saveHotel = await hotel.save();

      res.status(201).send(saveHotel); // Respond with the saved hotel data
    } catch (e) {
      console.log("Error creating hotel: ", e);
      res.status(500).json({ message: "Error creating hotel" });
    }
  }
);

/**
 * @route   GET /api/my-hotels
 * @desc    Fetch all hotels created by the current authenticated user
 * @access  Private
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId }); // Only return hotels that belong to the logged-in user
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error getting hotels" });
  }
});

/**
 * @route   GET /api/my-hotels/:id
 * @desc    Fetch details of a specific hotel owned by the current user
 * @access  Private
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();

  try {
    const hotel = await Hotel.findOne({ _id: id, userId: req.userId }); // Ensure user only accesses their own hotel
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error getting hotel" });
  }
});

/**
 * @route   PUT /api/my-hotels/:id
 * @desc    Update hotel details (optionally upload new images)
 * @access  Private
 */
router.put(
  "/:id",
  verifyToken,
  upload.array("imageURL", 8),
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id.toString();
    const imageFiles = req.files as Express.Multer.File[];
    const updatedHotel: HotelType = req.body;

    try {
      const hotel = await Hotel.findOne({ _id: id, userId: req.userId });

      if (!hotel) {
        res.status(404).json({ message: "Hotel not found" });
        return;
      }

      // Upload any new images if provided
      const uploadImages = imageFiles.map(async (image) => {
        const base64String = Buffer.from(image.buffer).toString("base64");
        const dataURI = "data:" + image.mimetype + ";base64," + base64String;
        const uploadImage = await cloundinary.v2.uploader.upload(dataURI);
        return uploadImage.secure_url;
      });

      const newImageURLs = await Promise.all(uploadImages);

      // Merge existing hotel images with any new uploaded images
      let finalImageURLs = [...hotel.imageURL];
      if (newImageURLs.length > 0) {
        finalImageURLs = [...finalImageURLs, ...newImageURLs];
      }

      updatedHotel.imageURL = finalImageURLs; // Assign final image list
      updatedHotel.lastUpdated = new Date(); // Update the lastUpdated field
      updatedHotel.userId = req.userId;

      await hotel.updateOne(updatedHotel); // Update hotel in database
      res.json(updatedHotel); // Return updated hotel
    } catch (error) {
      console.error("Error updating hotel:", error);
      res.status(500).json({ message: "Error updating hotel" });
    }
  }
);

/**
 * @route   DELETE /api/my-hotels/:id/images
 * @desc    Delete a specific image from a hotel's image array
 * @access  Private
 */
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
      const hotel = await Hotel.findOne({ _id: id, userId: req.userId });

      if (!hotel) {
        res.status(404).json({ message: "Hotel not found" });
        return;
      }

      // Remove the target image URL from the hotel's image list
      const updatedImageURLs = hotel.imageURL.filter(
        (url: string) => url !== imageUrl
      );

      if (updatedImageURLs.length === hotel.imageURL.length) {
        res.status(404).json({ message: "Image not found in hotel" });
        return;
      }

      hotel.imageURL = updatedImageURLs;
      hotel.lastUpdated = new Date();
      await hotel.save(); // Save updated hotel

      // Attempt to also delete the image from Cloudinary (optional)
      try {
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+?)\./); // Extract the publicId from Cloudinary URL
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        
        if (publicId) {
          await cloundinary.v2.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Even if Cloudinary fails, the database change is prioritized
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

/**
 * @route   GET /api/my-hotels/:id/bookings
 * @desc    Fetch all bookings for a specific hotel owned by the user
 * @access  Private
 */
router.get("/:id/bookings", verifyToken, async (req: Request, res: Response): Promise<any> => {
  const hotelId = req.params.id;
  const userId = req.userId;

  try {
    const hotel = await Hotel.findOne({ _id: hotelId, userId: userId });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or you don't have permission to view it" });
    }

    res.json(hotel); // Return the hotel with its bookings array
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ message: "Error fetching hotel bookings" });
  }
});

// Export router to be used in server/app.ts
export default router;
