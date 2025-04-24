import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;
  
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError(400, "Invalid Channel Id");
    }
    // Check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }
  
    // Toggle subscription
    const deletedSubDoc = await Subscription.findOneAndDelete({
      channel: channelId,
      subscriber: userId,
    });
  
    let subscribed = false;
    
    if (!deletedSubDoc) {
      // Create new subscription
      await Subscription.create({
        channel: channelId,
        subscriber: userId,
      });
      subscribed = true;
    }
  
    return res.status(200).json(
      new ApiResponse(
        200,
        { subscribed },
        `Successfully ${subscribed ? "subscribed" : "unsubscribed"}`
      )
    );
  });

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
  
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError(400, "Invalid Channel Id");
    }
  
    // Check channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiError(404, "Channel not found");
    }
  
    const subscribers = await Subscription.find({ channel: channelId })
      .populate("subscriber", "username fullName avatar")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select("-channel"); // Exclude channel field
  
    return res.status(200).json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
  });

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const subscriberId = req.params?.subscriberId || req.user._id;
    const subscriberId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
  
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
      throw new ApiError(400, "Invalid Subscriber Id");
    }
  
    // Check subscriber exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }
  
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
      .populate("channel", "username fullName avatar isVerified")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select("-subscriber"); // Exclude subscriber field
  
    return res.status(200).json(
      new ApiResponse(200, subscribedChannels, "Subscribed channels fetched")
    );
  });

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
