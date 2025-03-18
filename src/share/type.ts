export type UserType = {
  _id: string; // Unique identifier for the user
  email: string; // User's email address
  password: string; // User's password (should be hashed in a real-world scenario)
  firstName: string; // User's first name
  lastName: string; // User's last name
};
  
export type HotelType = {
  id: string;
  _id?: string; // Add this optional property for MongoDB's _id
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string;
  adultCount: number;
  childrenCount: number;
  facilities: string[];
  pricePerNight: number;
  rating: number;
  imageURL: string[];
  lastUpdated: Date;
};
  
  export type BookingType = {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    adultCount: number;
    childCount: number;
    checkIn: Date;
    checkOut: Date;
    totalCost: number;
  };
  
  export type HotelQueryResponse = {
    data: HotelType[];
    pagination: {
      totalHotels: number;
      page: number;
      pages: number;
    };
  };
  
  export type PaymentIntentResponse = {
    paymentIntentId: string;
    clientSecret: string;
    totalCost: number;
  };