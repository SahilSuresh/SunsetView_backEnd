import mongoose from "mongoose";

//define the hotel schema so we can start saving hotel on our database. 
export type HotelType = {
    id: string;
    userId: string;
    name: string;
    city: string;
    country: string;
    description: string;
    type: String;
    adultCount: number;
    childrenCount: number;
    facilities: string[];
    pricePerNight: number;
    rating: number;
    imageURL: string[];
    lastUpdated: Date;
}

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
    lastUpdated: {type: Date, required: true}


});

const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);

export default Hotel;