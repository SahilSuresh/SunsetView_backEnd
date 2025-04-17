// userModels/contactMessage.ts
import mongoose from "mongoose";

export type ContactMessageType = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  isCancellationRequest: boolean;
  status?: "pending" | "approved" | "rejected" | "completed";
  createdAt: Date;
  updatedAt: Date;
};

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    bookingId: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isCancellationRequest: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
contactMessageSchema.index({ isRead: 1, isCancellationRequest: 1 });
contactMessageSchema.index({ bookingId: 1 }, { sparse: true });

const ContactMessage = mongoose.model<ContactMessageType>(
  "ContactMessage",
  contactMessageSchema
);

export default ContactMessage;