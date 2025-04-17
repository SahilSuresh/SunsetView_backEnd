"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const hotel_1 = __importDefault(require("../userModels/hotel"));
const authRegister_1 = __importDefault(require("../middleware/authRegister"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 6 * 1024 * 1024, //6MB images
    },
});
//api/my-hotels
//make sure to use the same name on the frontEnd
router.post("/", authRegister_1.default, [
    //express validator to validate the form
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is necessary"),
    (0, express_validator_1.body)("city").notEmpty().withMessage("city is necessary"),
    (0, express_validator_1.body)("country").notEmpty().withMessage("country is necessary"),
    (0, express_validator_1.body)("description").notEmpty().withMessage("description is necessary"),
    (0, express_validator_1.body)("type").notEmpty().withMessage("Hotel type is necessary"),
    (0, express_validator_1.body)("pricePerNight")
        .notEmpty()
        .isNumeric()
        .withMessage("Per per neight is required and must be number"),
    (0, express_validator_1.body)("facilities")
        .notEmpty()
        .isArray()
        .withMessage("Facilities are neccessary"),
], upload.array("imageURL", 8), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imageFiles = req.files;
        const newHotel = req.body;
        //upload image to cloudinary
        const uploadImages = imageFiles.map((image) => __awaiter(void 0, void 0, void 0, function* () {
            const base64String = Buffer.from(image.buffer).toString("base64");
            let dataURI = "data:" + image.mimetype + ";base64," + base64String;
            const uploadImage = yield cloudinary_1.default.v2.uploader.upload(dataURI);
            return uploadImage.secure_url;
        }));
        const imageURL = yield Promise.all(uploadImages);
        newHotel.imageURL = imageURL;
        newHotel.lastUpdated = new Date();
        newHotel.userId = req.userId; // more secure to get the user id from the token
        const hotel = new hotel_1.default(newHotel); // saving it into newHote
        const saveHotel = yield hotel.save(); // save it to the databse
        // Return success
        res.status(201).send(saveHotel);
    }
    catch (e) {
        console.log("Error creating hotel: ", e);
        res.status(500).json({ message: "Error creating hotel" });
    }
}));
router.get("/", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ userId: req.userId });
        res.json(hotels);
    }
    catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Error getting hotels" });
    }
}));
router.get("/:id", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Whenveer we make the request random string express will take it as a parameter
    // and we can access it using req.params.id
    const id = req.params.id.toString();
    try {
        const hotel = yield hotel_1.default.findOne({ _id: id, userId: req.userId }); // the reason we use findOne is because we are looking for one hotel so we dont want users to be able to edit other users hotel
        res.json(hotel);
    }
    catch (error) {
        res.status(500).json({ message: "Error getting hotel" });
    }
}));
router.put("/:id", authRegister_1.default, upload.array("imageURL", 8), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id.toString();
    const imageFiles = req.files;
    const updatedHotel = req.body;
    try {
        console.log("Request body:", req.body);
        console.log("Uploaded files:", imageFiles.length);
        // Find the original hotel
        const hotel = yield hotel_1.default.findOne({ _id: id, userId: req.userId });
        console.log("Original hotel images:", hotel === null || hotel === void 0 ? void 0 : hotel.imageURL);
        if (!hotel) {
            res.status(404).json({ message: "Hotel not found" });
            return;
        }
        // Upload new images to cloudinary
        const uploadImages = imageFiles.map((image) => __awaiter(void 0, void 0, void 0, function* () {
            const base64String = Buffer.from(image.buffer).toString("base64");
            let dataURI = "data:" + image.mimetype + ";base64," + base64String;
            const uploadImage = yield cloudinary_1.default.v2.uploader.upload(dataURI);
            return uploadImage.secure_url;
        }));
        const newImageURLs = yield Promise.all(uploadImages);
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
        yield hotel.updateOne(updatedHotel);
        res.json(updatedHotel);
    }
    catch (error) {
        console.error("Error updating hotel:", error);
        res.status(500).json({ message: "Error updating hotel" });
    }
}));
// New route to delete a specific image from a hotel
router.delete("/:id/images", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id.toString();
    const imageUrl = req.query.imageUrl;
    if (!imageUrl) {
        res.status(400).json({ message: "Image URL is required" });
        return;
    }
    try {
        // First, find the hotel
        const hotel = yield hotel_1.default.findOne({ _id: id, userId: req.userId });
        if (!hotel) {
            res.status(404).json({ message: "Hotel not found" });
            return;
        }
        // Filter out the image URL from the imageURL array
        const updatedImageURLs = hotel.imageURL.filter((url) => url !== imageUrl);
        // Verify that the image was actually in the array
        if (updatedImageURLs.length === hotel.imageURL.length) {
            res.status(404).json({ message: "Image not found in hotel" });
            return;
        }
        // Update the hotel with the new image array
        hotel.imageURL = updatedImageURLs;
        hotel.lastUpdated = new Date();
        yield hotel.save();
        // Delete the image from Cloudinary if needed
        try {
            // Extract public id from the URL (this depends on your Cloudinary URL structure)
            // Example: https://res.cloudinary.com/dqgooesfi/image/upload/v1111111111/abcdefgh.jpg
            // We need to extract "abcdefgh" as the public ID
            const publicIdMatch = imageUrl.match(/\/v\d+\/(.+?)\./);
            const publicId = publicIdMatch ? publicIdMatch[1] : null;
            if (publicId) {
                yield cloudinary_1.default.v2.uploader.destroy(publicId);
                console.log(`Deleted image from Cloudinary: ${publicId}`);
            }
        }
        catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError);
            // We'll still return success since the DB was updated
        }
        res.status(200).json({
            message: "Image deleted successfully",
            updatedImageURLs
        });
    }
    catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Error deleting image" });
    }
}));
// Add this route handler to your my-hotels.ts route file in the backend
// Get bookings for a specific hotel
router.get("/:id/bookings", authRegister_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hotelId = req.params.id;
    const userId = req.userId;
    try {
        // Find the hotel that belongs to the user and has the specified ID
        const hotel = yield hotel_1.default.findOne({
            _id: hotelId,
            userId: userId
        });
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found or you don't have permission to view it" });
        }
        // Return the hotel with its bookings
        res.json(hotel);
    }
    catch (error) {
        console.error("Error fetching hotel bookings:", error);
        res.status(500).json({ message: "Error fetching hotel bookings" });
    }
}));
exports.default = router;
