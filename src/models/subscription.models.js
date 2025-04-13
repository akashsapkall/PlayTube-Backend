import mongoose from "mongoose";
const subscriptionSchema=new mongoose.Schema({
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // Added for better query performance
      },
      subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      }
},{timestamps:true});

export const Subscription=mongoose.model('Subscription',subscriptionSchema);