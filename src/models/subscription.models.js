import mongoose from "mongoose";
const subscriptionSchema=new mongoose.Schema({
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps:true});

export const Subscription=mongoose.model('Subscription',subscriptionSchema);