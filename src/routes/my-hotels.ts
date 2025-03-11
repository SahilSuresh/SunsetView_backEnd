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
  upload.array("imageFiles", 8),
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

export default router;
