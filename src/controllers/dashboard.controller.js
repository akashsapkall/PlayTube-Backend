import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
// import { Subscription } from "../models/subscription.model.js";
// import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
    if (mongoose.Types.ObjectId.isValid(req.user?._id)) {
      throw new ApiError(400, "Invalis User Id!!");
    }
    const stats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos",
          pipeline: [
            {
              $project: {
                _id: 1,
                views: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      // {
      //     $lookup: {
      //         from: "likes",
      //         localField: "videos._id",
      //         foreignField: "likeable",
      //         as: "likes"
      //       },
      // },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "owner",
          as: "comments",
          pipeline: [
            {
              $project: {
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "tweets",
          localField: "_id",
          foreignField: "owner",
          as: "tweets",
          pipeline: [
            {
              $project: {
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          let: {
            videoIds: "$videos._id",
            commentIds: "$comments._id",
            tweetIds: "$tweets._id",
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      {
                        $in: ["$likeable", "$$videoIds"],
                      },
                      {
                        $eq: ["$onModel", "Video"],
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        $in: ["$likeable", "$$commentIds"],
                      },
                      {
                        $eq: ["$onModel", "Comment"],
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        $in: ["$likeable", "$$tweetIds"],
                      },
                      {
                        $eq: ["$onModel", "Tweet"],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
      {
        $addFields: {
          totalVideos: {
            $size: "$videos",
          },
          totalComments: {
            $size: "$comments",
          },
          totalTweets: {
            $size: "$tweets",
          },
          totalSubscribers: {
            $size: "$subscribers",
          },
          totalLikes: {
            $size: "$likes",
          },
          totalViews: {
            $sum: "$videos.views",
          },
        },
      },
      {
        $project: {
          username: 1,
          avatar: 1,
          totalVideos: 1,
          totalComments: 1,
          totalTweets: 1,
          totalSubscribers: 1,
          totalLikes: 1,
          totalViews: 1,
        },
      },
    ]);
    if (stats.length === 0) {
      throw new ApiError(404, "Channel Stats Not Found!!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, stats[0], "Channel Stats Fetched Succesfully!!")
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal Server Error !!");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // Validate and sanitize input parameters
  try {
    const page = Math.max(parseInt(req.query.page)) || 1;
    const limit = Math.min(parseInt(req.query.limit)) || 10;
    const skip = (page - 1) * limit;

    // Aggregation pipeline for efficient pagination
    const pipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $facet: {
          metadata: [
            { $count: "totalVideos" },
            {
              $addFields: {
                page: page,
                limit: limit,
              },
            },
          ],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$metadata" },
    ];

    // Execute aggregation
    const [result] = await Video.aggregate(pipeline);

    // Handle no videos found
    if (!result?.metadata) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            videos: [],
            totalVideos: 0,
            totalPages: 0,
            page: page,
            limit: limit,
          },
          "No videos found"
        )
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(result.metadata.totalVideos / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos: result.data,
          totalVideos: result.metadata.totalVideos,
          totalPages: totalPages,
          page: result.metadata.page,
          limit: result.metadata.limit,
        },
        "Videos fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Internal Server Error !!");
  }
});

export { getChannelStats, getChannelVideos };
