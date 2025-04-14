import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page) || 1;
  const limitOfComments = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitOfComments;

  const aggregatePipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },
    // {
    //   $project: {
    //     content: 1,
    //     owner: 1,
    //     creaetdAt: 1,
    //   },
    // },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        metaData: [
          { $count: "totalComments" },
          {
            $addFields: {
              page: pageNumber,
              limit: limitOfComments,
            },
          },
        ],
        data: [
          { $skip: skip },
          { $limit: limitOfComments },
          {
            $project: {
              content: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$metaData",
    },
    // {
    //   $skip: skip,
    // },
    // {
    //   $limit: limitOfComments,
    // },
  ];
  const [comments] = await Comment.aggregate(aggregatePipeline);
  if (!comments?.metaData) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comments: [],
          totalComments: 0,
          totalPages: 0,
          page: pageNumber,
          limit: limitOfComments,
        },
        "Comments Not Fonund!!"
      )
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        comments: comments.data,
        totalComments: comments.metaData.totalComments,
        totalPages: Math.ceil(comments.metaData.totalComments/limitOfComments),
        page: pageNumber,
        limit: limitOfComments,
      }, "comments Fetched Successfully!!")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } =req.params;
  const { content } = req.body;
  console.log(content);
  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "inValid Video Id");
  }
  if (!content) {
    throw new ApiError(400, "Content Is required!");
  }
  const newComment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId,
  });
  if (!newComment) {
    throw new ApiError(500, "Failed To Create Comment!!");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "comment created successfully!!"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } =req.params;
  const { updatedContent } = req.body;
  if (!updatedContent) {
    throw new ApiError(400, "Content is required!");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Comment id is invalid !!");
  }
  const userId = req.user._id;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment Not found!!");
  }
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User is not authorized to edit this comment !!");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: updatedContent,
      },
    },
    { new: true }
  );
  if (!updatedComment) {
    throw new ApiError(500, "Failed To Update Comment!!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "comment updated successfully!!")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Comment id is invalid !!");
  }
  const userId = req.user._id;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment Not found!!");
  }
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User is not authorized to delete this comment !!");
  }
  const deleteComment = await Comment.findByIdAndDelete(commentId);
  //   const deletedComment = await Comment.findOneAndDelete({
  //     _id: commentId,
  //     owner: userId,
  //   });
  if (!deleteComment) {
    throw new ApiError(500, "Failed To Delete Comment!!");
  }
  await Like.deleteMany({
    likeable:commentId,
    onModel:"Comment",
  })
  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "comment deleted successfully!!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
