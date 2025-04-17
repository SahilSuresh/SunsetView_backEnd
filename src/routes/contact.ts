// routes/contact.ts
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import ContactMessage from "../userModels/contactMessage";
import Hotel from "../userModels/hotel";
import User from "../userModels/user";
import verifyToken from "../middleware/authRegister";
import { sendCancellationApprovedEmail, sendCancellationRejectedEmail } from "../services/emailService";

const router = express.Router();

// Submit contact form
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject").notEmpty().withMessage("Subject is required"),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 10 })
      .withMessage("Message must be at least 10 characters"),
  ],
  async (req: Request, res: Response): Promise<any> => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, subject, message, bookingId } = req.body;

      // Check if this is a cancellation request
      const isCancellationRequest = 
        subject === "Booking Cancellation Request" || 
        message.includes("cancellation") ||
        !!bookingId;

      // Create contact message
      const contactMessage = new ContactMessage({
        name,
        email,
        subject,
        message,
        bookingId: bookingId || null,
        isCancellationRequest,
        status: isCancellationRequest ? "pending" : undefined,
      });

      // Save to database
      await contactMessage.save();

      // Send response
      res.status(201).json({
        message: "Message sent successfully",
        isCancellationRequest,
      });
    } catch (error) {
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }
);

// Get all contact messages (Admin only)
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (this should be handled by verifyAdmin middleware in production)
    // For now, we'll assume this route is protected by admin middleware

    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Mark message as read
router.patch(
  "/:messageId/read",
  verifyToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { messageId } = req.params;

      const message = await ContactMessage.findByIdAndUpdate(
        messageId,
        { isRead: true },
        { new: true }
      );

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Process cancellation request
router.patch(
  "/:messageId/process-cancellation",
  verifyToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { messageId } = req.params;
      const { status } = req.body;

      // Validate status
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Find the message
      const message = await ContactMessage.findById(messageId);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (!message.isCancellationRequest) {
        return res
          .status(400)
          .json({ message: "This message is not a cancellation request" });
      }

      if (!message.bookingId) {
        return res
          .status(400)
          .json({ message: "No booking ID associated with this request" });
      }

      // Find booking information from hotel to get more details
      let hotelName = "your hotel booking";
      let bookingDetails = null;
      
      // Find hotels that have this booking
      const hotels = await Hotel.find({ "bookings._id": message.bookingId });
      
      if (hotels.length > 0) {
        const hotel = hotels[0];
        hotelName = hotel.name;
        
        // Find the booking
        const bookingIndex = hotel.bookings.findIndex(
          (b) => b._id.toString() === message.bookingId
        );
        
        if (bookingIndex !== -1) {
          bookingDetails = hotel.bookings[bookingIndex];
        }
      }

      // If status is "approved", cancel the booking
      if (status === "approved") {
        // Process the cancellation in hotels collection
        for (const hotel of hotels) {
          const bookingIndex = hotel.bookings.findIndex(
            (b) => b._id.toString() === message.bookingId
          );

          if (bookingIndex !== -1) {
            // Remove the booking
            hotel.bookings.splice(bookingIndex, 1);
            await hotel.save();
          }
        }
      }

      // Update message status
      message.status = status;
      await message.save();
      
      // Send email notification to the user
      try {
        // Get user's full name if possible, otherwise use the name from the message
        const recipientEmail = message.email;
        const recipientName = message.name;
        
        if (status === "approved") {
          await sendCancellationApprovedEmail(
            recipientEmail,
            recipientName,
            hotelName,
            message.bookingId
          );
        } else if (status === "rejected") {
          await sendCancellationRejectedEmail(
            recipientEmail,
            recipientName,
            hotelName,
            message.bookingId
          );
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the request if email fails, just log the error
      }

      res.json({
        message: `Cancellation request ${status}`,
        status,
        emailSent: true
      });
    } catch (error) {
      console.error("Error processing cancellation:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;