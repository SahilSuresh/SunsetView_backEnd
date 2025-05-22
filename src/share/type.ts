

/**
 * UserType
 * 
 * Represents a registered user account in the system.
 * 
 * Important:
 * - Passwords must be stored securely (hashed).
 * - Supports optional password reset functionality (token + expiry).
 * - Admin users are differentiated via isAdmin flag.
 */
export type UserType = {
    _id: string;                      // MongoDB ObjectId (as string)
    email: string;                    // User's email address (unique across users)
    password: string;                 // User's password (hashed)
    firstName: string;                // First name of the user
    lastName: string;                 // Last name of the user
    resetPasswordToken: string | null; // Token for password reset (null if not requested)
    resetPasswordExpires: Date | null; // Expiration time for reset token
    isAdmin: boolean;                 // Indicates if the user has admin privileges
};
/**
 * HotelType
 * 
 * Represents a hotel property listed by a user (hotel owner).
 * 
 * Important Design:
 * - userId links the hotel back to the owner (multi-tenant system: users manage only their hotels).
 * - images are stored in Cloudinary, referenced by URL.
 * - bookings array stores all bookings made for this hotel.
 */
export type HotelType = {
  id: string;              // Temporary ID (for frontend mapping) — optional if using MongoDB's _id
  _id?: string;            // MongoDB's actual ObjectId for database usage (optional because sometimes frontend only needs id)
  userId: string;          // Owner of the hotel (userId reference)
  name: string;            // Hotel name (e.g., "Grand Palace Hotel")
  city: string;            // City where the hotel is located
  country: string;         // Country where the hotel is located
  description: string;     // Full description of the hotel
  type: string;            // Hotel type (e.g., Resort, Apartment, Hostel)
  adultCount: number;      // Max number of adults that can stay
  childrenCount: number;   // Max number of children allowed
  facilities: string[];    // List of available facilities (e.g., "Wi-Fi", "Pool", "Gym")
  pricePerNight: number;   // Base price per night for an adult
  rating: number;          // Average rating (1-5 stars) based on reviews (future improvement)
  imageURL: string[];      // Array of Cloudinary image URLs
  lastUpdated: Date;       // When this hotel was last edited (important for sorting)
  bookings: BookingType[]; // Array of all bookings associated with this hotel
};

/**
 * BookingType
 * 
 * Represents a hotel booking made by a user.
 * 
 * Important Design:
 * - User details are stored at booking time (firstName, lastName, email) to avoid issues if user later updates profile.
 * - Booking info like checkIn/checkOut dates, number of guests, and total payment are stored.
 */
export type BookingType = {
  _id: string;              // Unique booking identifier (MongoDB ObjectId as string)
  userId: string;           // User who made the booking (links to UserType._id)
  firstName: string;        // User's first name at the time of booking
  lastName: string;         // User's last name at the time of booking
  email: string;            // Email at the time of booking (used for sending confirmations)
  adultCount: number;       // Number of adults in the booking
  childrenCount: number;    // Number of children in the booking
  checkIn: Date;            // Check-in date
  checkOut: Date;           // Check-out date
  bookingTotalCost: number; // Final price calculated for the booking (adults + children + nights)
};

/**
 * HotelQueryResponse
 * 
 * Response shape when searching or listing hotels (for pagination).
 * 
 * Important:
 * - Always include pagination metadata to support infinite scroll / paginated UI.
 */
export type HotelQueryResponse = {
  data: HotelType[];        // Array of hotels matching the search or filters
  pagination: {
    totalHotels: number;    // Total number of hotels matching the query
    page: number;           // Current page number
    pages: number;          // Total number of pages available
  };
};

/**
 * PaymentIntentResponse
 * 
 * Response sent to frontend after creating a Stripe Payment Intent.
 * 
 * Logic:
 * - Stripe requires clientSecret to proceed with the payment securely.
 * - bookingTotalCost is also returned to show the user the final amount before payment confirmation.
 */
export type PaymentIntentResponse = {
  paymentIntentId: string;    // Stripe payment intent ID (for tracking payment)
  clientSecret: string;       // Secret token used by Stripe frontend library to complete the transaction
  bookingTotalCost: number;   // The total amount that the user will be charged
};


/**
 * ContactMessageType
 * 
 * Defines the TypeScript type for contact messages.
 * 
 * Fields:
 * - Stores basic form submission (name, email, subject, message).
 * - Supports optional booking ID if the message is a cancellation request.
 * - Tracks read/unread status for admin review.
 * - Tracks cancellation request lifecycle status (pending, approved, etc).
 */
export type ContactMessageType = {
  _id: string;                          // Unique MongoDB ObjectId (stringified)
  name: string;                         // Name of the person submitting the message
  email: string;                        // Email address of the sender
  subject: string;                      // Subject/title of the message
  message: string;                      // Main content/body of the message
  bookingId?: string;                   // Optional booking ID (only for cancellation-related messages)
  isRead: boolean;                      // Tracks whether the message has been read by admin
  isCancellationRequest: boolean;       // Whether this is a booking cancellation request
  status?: "pending" | "approved" | "rejected" | "completed"; // Cancellation workflow status
  createdAt: Date;                      // Automatically populated when message is created
  updatedAt: Date;                      // Automatically updated whenever message is modified
};