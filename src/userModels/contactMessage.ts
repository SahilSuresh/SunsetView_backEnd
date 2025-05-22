// Import Mongoose for MongoDB schema and model creation
import mongoose from "mongoose";
import { ContactMessageType } from "../share/type"; // Import shared types for strong typing



/**
 * Mongoose Schema Definition
 * 
 * Defines the structure of a ContactMessage document in MongoDB.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Cannot submit a message without a name
    },
    email: {
      type: String,
      required: true, // Email address is required for follow-up communication
    },
    subject: {
      type: String,
      required: true, // Subject helps admins prioritize and categorize messages
    },
    message: {
      type: String,
      required: true, // The actual content of the inquiry or request
    },
    bookingId: {
      type: String,
      default: null, // Not all messages are related to bookings; optional field
    },
    isRead: {
      type: Boolean,
      default: false, // New messages are unread by default
    },
    isCancellationRequest: {
      type: Boolean,
      default: false, // Default to false; set to true when user requests a booking cancellation
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"], // Allowed values
      default: "pending", // New cancellation requests start in pending state
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt timestamps
  }
);

// Indexes
// Improve performance when querying by isRead and isCancellationRequest
contactMessageSchema.index({ isRead: 1, isCancellationRequest: 1 });
// Optional sparse index for bookingId (only indexed if field exists)
contactMessageSchema.index({ bookingId: 1 }, { sparse: true });

/**
 * Mongoose Model
 * 
 * Export a reusable model instance to interact with the contact messages collection.
 */
const ContactMessage = mongoose.model<ContactMessageType>(
  "ContactMessage",
  contactMessageSchema
);

export default ContactMessage;
