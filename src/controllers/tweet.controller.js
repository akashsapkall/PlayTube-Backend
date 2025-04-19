import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content is required");
  }
  const newTweet = await Tweet.create({
    content: content.trim(),
    owner: userId,
  });
  // const populatedTweet = await Tweet.populate(newTweet, {
  //     path: 'owner',
  //     select: 'username avatar'
  // });
  if (!newTweet) {
    throw new ApiError(500, "Failed To Create New Tweet!!");
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newTweet,
        "New Tweet Has Been Created Successfully!!"
      )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id

  const { page = 1, limit = 10 } = req.query;
  const pageNumber=parseInt(page);
  const limitOnPage=parseInt(limit);
  const skip = (pageNumber - 1) * limitOnPage;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User Id!!");
  }

  const aggregatePipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "likes",
          let:{ tweetId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$likeable", "$$tweetId"],
                    },
                    {
                      $eq: ["$onModel", "Tweet"],
                    },
                  ],
                },
              },
            },
          ],
          as:"likes"
        }
      },
      {
        $addFields: {
          likeCount:{
            $size:"$likes"
          }
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metaData: [
            { $count: "totalTweets" },
            {
              $addFields: {
                page: pageNumber,
                limit:limitOnPage,
              },
            },
          ],
          data: [
            { $skip: skip },
            { $limit: limitOnPage },
            {
              $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                likeCount:1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$metaData",
      },
    ];
    const [tweets] = await Tweet.aggregate(aggregatePipeline);
  // const tweets = await Tweet.find({
  //   owner: userId,
  // })
  //   .sort({ createdAt: -1 })
  //   .skip(skip)
  //   .limit(parseInt(limit))
  //   .select("-owner") //.populate("owner","username avatar",)
  //   .lean();// plain js object
  if (!tweets?.metaData) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          tweets: [],
          totalTweets: 0,
          totalPages: 0,
          page: pageNumber,
          limit: limitOnPage,
        },
        "Tweets Not Fonund!!"
      )
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        tweets: tweets.data,
        totalTweets: tweets.metaData.totalTweets,
        totalPages: Math.ceil(tweets.metaData.totalTweets/limitOnPage),
        page: pageNumber,
        limit: limitOnPage,
      }, "tweets Fetched Successfully!!")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const userId=req.user._id;
  const tweetId=req.params?.tweetId;
  console.log(tweetId);
  const {content}=req.body;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id!!");
  }
  if(!content.trim()){
    throw new ApiError(400, "Tweet content is required");
  }
  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: userId,
    },
    {
      $set: {
        content: content.trim(),
        updatedAt: new Date() // Explicit update timestamp
      }
    },
    {
      new: true,
      runValidators: true, // Ensure schema validations run
      select: '-__v' // Exclude version key
    }
  );
  if(!updatedTweet){
    throw new ApiError(404, "Tweet not found or unauthorized")
  }
  return res.status(200)
  .json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully!!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const userId=req.user._id;
  const tweetId=req.params?.tweetId;
  const deletedTweet=await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: userId,
  });
  if(!deletedTweet){
    throw new ApiError(404, "Tweet not found or unauthorized")
  }
  await Like.deleteMany({
    likeable:tweetId,
    onModel:"Tweet",
  });
  return res.status(200)
  .json(new ApiResponse(200, deletedTweet, " Tweet Deleted Successfully!!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
