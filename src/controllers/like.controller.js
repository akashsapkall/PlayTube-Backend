import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
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

  let liked = false;
  if (!result) {
    // Like didn't exist - create new
    await Like.create({
      owner: userId,
      action:"LIKED",
      likeable: videoId,
      onModel: "Video",
    });
    liked = true;
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { liked },
        `Video ${liked ? "liked" : "unliked"} successfully`
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
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
      likeable: commentId,
      onModel: "Comment",
    });
  
    let liked = false;
    if (!result) {
      // Like didn't exist - create new
      await Like.create({
        owner: userId,
        action:"LIKED",
        likeable: commentId,
        onModel: "Comment",
      });
      liked = true;
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { liked },
          `Comment ${liked ? "liked" : "unliked"} successfully`
        )
      );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
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
  
    let liked = false;
    if (!result) {
      // Like didn't exist - create new
      await Like.create({
        owner: userId,
        action:"LIKED",
        likeable: tweetId,
        onModel: "Tweet",
      });
      liked = true;
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { liked },
          `Tweet ${liked ? "liked" : "unliked"} successfully`
        )
      );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Validate and parse pagination parameters
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
  
    const pipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
          action:"LIKED",
          onModel: "Video"
        }
      },
      {
        $sort: { createdAt: -1 } // Sort likes by creation date
      },
      {
        $lookup: {
          from: "videos",
          localField: "likeable",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
              }
            },
            { $unwind: "$owner" }
          ]
        }
      },
      { $unwind: "$video" }, // Convert video array to object
      {
        $replaceRoot: { newRoot: "$video" } // Promote video to root
      },
      {
        $facet: {
          metadata: [{ $count: "totalLikes" }],
          data: [
            { $skip: skip },
            { $limit: limit }
          ]
        }
      },
      { $unwind: "$metadata" }
    ];
  
    try {
      const [result] = await Like.aggregate(pipeline);
  
      if (!result?.metadata) {
        return res.status(200).json(
          new ApiResponse(200, {
            videos: [],
            totalLikes: 0,
            totalPages: 0,
            page,
            limit
          }, "No liked videos found")
        );
      }
  
      const response = {
        videos: result.data,
        totalLikes: result.metadata.totalLikes,
        totalPages: Math.ceil(result.metadata.totalLikes / limit),
        page,
        limit
      };
  
      return res.status(200).json(
        new ApiResponse(200, response, "Liked videos fetched successfully")
      );
  
    } catch (error) {
      throw new ApiError(500, "Failed to fetch liked videos: " + error.message);
    }
  });

// const getLikedVideos = asyncHandler(async (req, res) => {
//     const userId = req.user._id;
//     const { page = 1, limit = 6 } = req.query;
    
//     // Fixed: Correct variable names and parsing
//     const pageNumber = parseInt(page) || 1;
//     const limitOnPage = parseInt(limit) || 6; // Changed from 'page' to 'limit'
//     const skip = (pageNumber - 1) * limitOnPage;
  
//     const pipeline = [
//       {
//         $match: {
//           owner: new mongoose.Types.ObjectId(userId),
//           onModel: "Video"
//         }
//       },
//       {
//         $lookup: {
//           from: "videos",
//           localField: "likeable",
//           foreignField: "_id",
//           as: "video"
//         }
//       },
//       {
//         // Fixed: Corrected $arrayElemAt operator name
//         $addFields: {
//           video: { $arrayElemAt: ["$videos", 0] }
//         }
//       },
//       {
//         $project: {
//           videos: 1,
//         }
//       },
//       {
//         $sort: {
//           createdAt: -1,
//         }
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limitOnPage,
//       }
//     ];
  
//     const allLikedVideos = await Like.aggregate(pipeline);
  
//     if (allLikedVideos.length === 0) {
//       return res.status(200)
//         .json(new ApiResponse(200, [], "No videos liked by user!!")); // Fixed: Return empty array
//     }
  
//     // Fixed: Return actual videos data instead of empty object
//     return res.status(200)
//       .json(new ApiResponse(200, allLikedVideos, "Videos liked by user fetched successfully!!"));
//   });

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
