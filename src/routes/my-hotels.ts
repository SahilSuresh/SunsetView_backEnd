import express, { Request, Response } from "express";
import multer from "multer";
import cloundinary from "cloudinary";
import Hotel, { HotelType } from "../userModels/hotel";
import verifyToken from "../middleware/authRegister"; // Import the middleware
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

export default router;
