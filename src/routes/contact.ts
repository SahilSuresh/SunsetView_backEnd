// routes/contact.ts

/**
 * Contact Message Routes
 * 
 * Purpose:
 * - Users can submit general queries or cancellation requests via a contact form.
 * - Admins can view, mark messages as read, and process (approve/reject) cancellation requests.
 * 
 * Special Logic:
 * - If the contact message subject or content mentions "cancellation" OR includes a bookingId,
 *   the system automatically treats it as a cancellation request.
 */

import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import ContactMessage from "../userModels/contactMessage";
import Hotel from "../userModels/hotel";
import User from "../userModels/user";
import verifyToken from "../middleware/authRegister";
import { sendCancellationApprovedEmail, sendCancellationRejectedEmail } from "../services/emailService";

// Create Express router
const router = express.Router();

/**
 * @route   POST /contact
 * @desc    Submit a contact form (can be general inquiry or cancellation request)
 * @access  Public
 */
router.post(
  "/",
  [
    // Input validation rules
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If validation fails, return the first validation error
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, subject, message, bookingId } = req.body;

      // Logic to determine if it's a cancellation request:
      // - Subject is "Booking Cancellation Request"
      // - Message text mentions "cancellation"
      // - Booking ID provided
      const isCancellationRequest = 
        subject === "Booking Cancellation Request" || 
        message.includes("cancellation") ||
        !!bookingId;

      // Create a new contact message document
      const contactMessage = new ContactMessage({
        name,
        email,
        subject,
        message,
        bookingId: bookingId || null,
        isCancellationRequest,
        status: isCancellationRequest ? "pending" : undefined, // Set initial status if it's a cancellation
      });

      await contactMessage.save();

      // Successfully saved
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

/**
 * @route   GET /contact
 * @desc    Retrieve all contact messages (for admin dashboard)
 * @access  Private (Admin only)
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Retrieve all messages, latest first
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

/**
 * @route   PATCH /contact/:messageId/read
 * @desc    Mark a specific contact message as "read"
 * @access  Private (Admin only)
 */
router.patch("/:messageId/read", verifyToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;

    const message = await ContactMessage.findByIdAndUpdate(
      messageId,
      { isRead: true }, // Set isRead flag to true
      { new: true }     // Return updated document
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PATCH /contact/:messageId/process-cancellation
 * @desc    Admin approves or rejects a booking cancellation request
 * @access  Private (Admin only)
 */
router.patch("/:messageId/process-cancellation", verifyToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { status } = req.body; // Expected: 'approved' or 'rejected'

    // Only allow "approved" or "rejected"
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const message = await ContactMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Ensure that the message is indeed a cancellation request
    if (!message.isCancellationRequest) {
      return res.status(400).json({ message: "This message is not a cancellation request" });
    }

    if (!message.bookingId) {
      return res.status(400).json({ message: "No booking ID associated with this request" });
    }

    // Find hotel(s) containing the booking to be cancelled
    let hotelName = "your hotel booking"; // Default value
    let bookingDetails = null;

    const hotels = await Hotel.find({ "bookings._id": message.bookingId });

    if (hotels.length > 0) {
      const hotel = hotels[0];
      hotelName = hotel.name;

      const bookingIndex = hotel.bookings.findIndex(
        (b) => b._id.toString() === message.bookingId
      );

      if (bookingIndex !== -1) {
        bookingDetails = hotel.bookings[bookingIndex];
      }
    }

    // If approved, actually remove the booking
    if (status === "approved") {
      for (const hotel of hotels) {
        const bookingIndex = hotel.bookings.findIndex(
          (b) => b._id.toString() === message.bookingId
        );

        if (bookingIndex !== -1) {
          hotel.bookings.splice(bookingIndex, 1); // Remove the booking from hotel's bookings
          await hotel.save(); // Save hotel after removal
        }
      }
    }

    // Update contact message status
    message.status = status;
    await message.save();

    // Send notification email to customer
    try {
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
      // Even if email fails, the cancellation is still processed
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
});

export default router;
