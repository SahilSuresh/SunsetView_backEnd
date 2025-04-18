import mongoose from "mongoose";
import { BookingType, HotelType } from "../share/type";


const bookingScheme = new mongoose.Schema<BookingType>({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    adultCount: {type: Number, required: true},
    childrenCount: {type: Number, required: true},
    checkIn: {type:Date, required: true},
    checkOut: {type:Date, required: true},
    userId: {type: String, required: true},
    bookingTotalCost: {type: Number, required: true}

})
const hotelSchema = new mongoose.Schema<HotelType>({
    userId: {type: String, required: true},
    name: {type: String, required: true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    description: {type: String, required: true},
    type: {type: String, required: true},
    adultCount: {type: Number, required: true},
    childrenCount: {type: Number, required: true},
    facilities: [{type: String, required: true}],
    pricePerNight: {type: Number, required: true},
    rating: {type: Number, required: true},
    imageURL: [{type: String, required: true}],
    lastUpdated: {type: Date, required: true},
    bookings: [bookingScheme],
});

const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);

export default Hotel;