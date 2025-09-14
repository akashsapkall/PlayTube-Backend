import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoDislike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  // Validate videoId format
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Check if video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  // Atomic toggle operation
  const result = await Like.findOneAndDelete({
    owner: userId,
    likeable: videoId,
    onModel: "Video",
  });

  let disliked = false;
  if (!result) {
    // Like didn't exist - create new
    await Like.create({
      owner: userId,
      action:"DISLIKED",
      likeable: videoId,
      onModel: "Video",
    });
    disliked = true;
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { disliked },
        `Video ${disliked ? "disliked" : "undisliked"} successfully`
      )
    );
});

const toggleCommentDislike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
  
    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError(400, "Invalid Comment ID");
    }
  
    // Check if video exists
    const commentExists = await Comment.exists({ _id: commentId });
    if (!commentExists) {
      throw new ApiError(404, "Comment not found");
    }
  
    // Atomic toggle operation
    const result = await Like.findOneAndDelete({
      owner: userId,
      action:"DISLIKED",
      likeable: commentId,
      onModel: "Comment",
    });
  
    let disliked = false;
    if (!result) {
      // Like didn't exist - create new
      await Like.create({
        owner: userId,
        action:"DISLIKED",
        likeable: commentId,
        onModel: "Comment",
      });
      disliked = true;
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { disliked },
          `Comment ${disliked ? "disliked" : "undisliked"} successfully`
        )
      );
});

const toggleTweetDislike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;
  
    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
      throw new ApiError(400, "Invalid Tweet ID");
    }
  
    // Check if video exists
    const tweetExists = await Tweet.exists({ _id: tweetId });
    if (!tweetExists) {
      throw new ApiError(404, "Tweet not found");
    }
  
    // Atomic toggle operation
    const result = await Like.findOneAndDelete({
      owner: userId,
      likeable: tweetId,
      onModel: "Tweet",
    });
  
    let disliked = false;
    if (!result) {
      // Like didn't exist - create new
      await Like.create({
        owner: userId,
        action:"DISLIKED",
        likeable: tweetId,
        onModel: "Tweet",
      });
      disliked = true;
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { disliked },
          `Tweet ${disliked ? "disliked" : "undisliked"} successfully`
        )
      );
});
export { toggleCommentDislike, toggleTweetDislike, toggleVideoDislike };
