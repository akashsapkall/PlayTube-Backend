import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
// import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadVideoAndThumbnailOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getVideos = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitOnPage = parseInt(limit);
  const skip = (pageNumber - 1) * limitOnPage;

  const searchRegex = new RegExp(query, "i");

  // 1. First find all users matching the search query
  const matchingUsers = await User.find({
    $or: [{ username: searchRegex }, { fullName: searchRegex }],
  }).select("_id");
  // const match = { isPublished: true };

  // if (userId) {
  //   match.owner = new mongoose.Types.ObjectId(userId);
  // }

  // if (query) {
  //   match.$or = [
  //     { title: { $regex: query, $options: "i" } },
  //     { description: { $regex: query, $options: "i" } },
  //   ];
  // }

  const sortStage = {};

  if (sortBy === "views") {
    sortStage.views = sortType === "asc" ? 1 : -1;
  } else if (sortBy === "likes") {
    sortStage.likesCount = sortType === "asc" ? 1 : -1;
  } else {
    sortStage.createdAt = -1; // default sort
  }

  const pipeline = [
    {
      $match: {
        isPublished: true,
        $or: [
          // Match video content
          { $or: [{ title: searchRegex }, { description: searchRegex }] },
          // Match owner ID from user search
          { owner: { $in: matchingUsers.map((u) => u._id) } },
        ],
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
      $lookup: {
        from: "likes",
        let: {
          videoId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$likeable", "$$videoId"],
                  },
                  {
                    $eq: ["$onModel", "Video"],
                  },
                  {
                    $eq: ["$action", "LIKED"],
                  },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
        likesCount: {
          $size: "$likes",
        },
      },
    },
    // {
    //   $sort: {
    //     ...(sortBy === "views" && { views: sortType === "asc" ? 1 : -1 }),
    //     ...(sortBy === "likes" && { likesCount: sortType === "asc" ? 1 : -1 }),
    //     ...(!sortBy && { createdAt: -1 }), // Default sort by newest
    //   },
    // },
    {
      $sort: sortStage,
    },
    {
      $facet: {
        metadata: [
          { $count: "totalVideos" },
          { $addFields: { page: pageNumber, limit: limitOnPage } },
        ],
        data: [
          { $skip: skip },
          { $limit: limitOnPage },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              duration: 1,
              thumbnail: 1,
              views: 1,
              likesCount: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$metadata",
    },
  ];

  const result = await Video.aggregate(pipeline);
  const response = result[0] || {
    metadata: { totalVideos: 0, page: pageNumber, limit: limitOnPage },
    data: [],
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: response.data,
        totalVideos: response.metadata.totalVideos,
        totalPages: Math.ceil(response.metadata.totalVideos / limitOnPage),
        currentPage: response.metadata.page,
        limit: response.metadata.limit,
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = false } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title.trim() || !description.trim()) {
    throw new ApiError(400, "Title and Description both required!!");
  }
  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "video and thumbnail files are required!");
  }
  try {
    // Parallel uploads for better performance
    const [videoUpload, thumbnailUpload] = await Promise.all([
      uploadVideoAndThumbnailOnCloudinary(
        videoFile.buffer,
        "video",
        "xTubeVideos"
      ),
      uploadVideoAndThumbnailOnCloudinary(
        thumbnailFile.buffer,
        "image",
        "xTubeThumbnails"
      ),
    ]);

    if (!videoUpload?.secure_url || !thumbnailUpload?.secure_url) {
      await Promise.all([
        videoUpload?.public_id &&
          deleteFromCloudinary(videoUpload.public_id, "video"),
        thumbnailUpload?.public_id &&
          deleteFromCloudinary(thumbnailUpload.public_id),
      ]);
      throw new ApiError(500, "Failed TO Upload On Cloudinary!!");
    }
    const video = await Video.create({
      title: title.trim(),
      description: description.trim(),
      videoFile: {
        url: videoUpload.secure_url,
        publicId: videoUpload.public_id,
      },
      thumbnail: {
        url: thumbnailUpload.secure_url,
        publicId: thumbnailUpload.public_id,
      },
      duration: videoUpload.duration,
      views: 0,
      isPublished,
      owner: req.user._id,
    });
    if (!video) {
      await Promise.all([
        deleteFromCloudinary(videoUpload.public_id, "video"),
        deleteFromCloudinary(thumbnailUpload.public_id),
      ]);
      throw new ApiError(500, "Failed To Publish A Video!!");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video Published Successfully!!"));
  } catch (e) {
    throw new ApiError(500, e.message || "Failed To Upload Video !!");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video Id Is Invalid!!");
  }
  const pipeline = [
    {
      $match: {
        isPublished: true,
        _id: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "likes",
        let: { videoId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$likeable", "$$videoId"],
                  },
                  {
                    $eq: ["$onModel", "Video"],
                  },
                  {
                    $eq: ["$action", "LIKED"],
                  },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        likes: 0,
      },
    },
  ];
  // await Video.findOneAndUpdate(
  //   {
  //     isPublished: true,
  //     _id: videoId,
  //   },
  //   {
  //     $set: {
  //       views: views + 1,
  //     },
  //   },
  //   {
  //     new: true,
  //     validator: true,
  //   }
  // )
  // Increment the views field and fetch the updated video
  const updatedVideo = await Video.findOneAndUpdate(
    {
      isPublished: true,
      _id: videoId,
    },
    {
      $inc: { views: 1 }, // Increment the views field
    },
    {
      new: true, // Return the updated document
    }
  );
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or is unpublished!!");
  }
  const video = await Video.aggregate(pipeline);
  if (!video || video.length === 0) {
    throw new ApiError(404, "Video not found or is unpublished!!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video Fetched Successfully!!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailFile = req.file;
  console.log("TITLE:", title);
  console.log("DESC:", description);
  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID!");
  }

  // Fetch the video to ensure it exists and belongs to the user
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(
      404,
      "Video not found or you do not have permission to update it!"
    );
  }

  // Preserve existing values if not provided in the request
  const updatedTitle = title ? title.trim() : video.title;
  const updatedDescription = description
    ? description.trim()
    : video.description;

  // Handle thumbnail upload
  let thumbnailUrl = video.thumbnail.url;
  let thumbnailPublicId = video.thumbnail.publicId;

  if (thumbnailFile) {
    const thumbnailUpload = await uploadVideoAndThumbnailOnCloudinary(
      thumbnailFile.buffer,
      "image",
      "xTubeThumbnails"
    );

    if (!thumbnailUpload || !thumbnailUpload.secure_url) {
      throw new ApiError(500, "Failed to upload thumbnail to Cloudinary!");
    }

    // Delete the old thumbnail if it exists
    if (video.thumbnail.publicId) {
      await deleteFromCloudinary(video.thumbnail.publicId);
    }

    thumbnailUrl = thumbnailUpload.secure_url;
    thumbnailPublicId = thumbnailUpload.public_id;
  }

  // Update the video
  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user._id,
    },
    {
      $set: {
        title: updatedTitle,
        description: updatedDescription,
        thumbnail: {
          url: thumbnailUrl,
          publicId: thumbnailPublicId,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // Handle empty results (should not occur due to earlier checks)
  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video!");
  }

  // Return the updated video in the response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID!");
  }

  // Find and delete the video
  const deletedVideo = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user._id,
  });

  if (!deletedVideo) {
    throw new ApiError(
      404,
      "Video not found or you do not have permission to delete it!"
    );
  }

  // Delete associated files from Cloudinary
  const [videoFileResult, thumbnailResult] = await Promise.allSettled([
    deleteFromCloudinary(deletedVideo.videoFile?.publicId, "video"),
    deleteFromCloudinary(deletedVideo.thumbnail?.publicId),
  ]);

  // Log errors if any deletion fails
  if (videoFileResult.status === "rejected") {
    console.error(
      "Failed to delete video file from Cloudinary:",
      videoFileResult.reason
    );
  }
  if (thumbnailResult.status === "rejected") {
    console.error(
      "Failed to delete thumbnail from Cloudinary:",
      thumbnailResult.reason
    );
  }

  // Delete related likes and comments
  await Like.deleteMany({
    likeable: deletedVideo._id,
    onModel: "Video",
  });

  await Comment.deleteMany({
    video: deletedVideo._id,
  });

  // Return a success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedVideo,
        "Video and related likes and comments deleted successfully!"
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID!");
  }

  // Extract isPublished from the request body
  let { isPublished } = req.body;

  // Validate that isPublished is a boolean
  if (typeof isPublished !== "boolean") {
    throw new ApiError(400, "isPublished must be a boolean value!");
  }

  // Find and update the video
  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user._id,
    },
    {
      $set: {
        isPublished: isPublished,
      },
    },
    {
      new: true, // Return the updated document
      runValidators: true, // Ensure schema validation is applied
    }
  );

  // Handle empty results
  if (!updatedVideo) {
    throw new ApiError(
      404,
      "Video not found or you do not have permission to update it!"
    );
  }

  // Return a success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: updatedVideo.isPublished },
        "Publish status updated successfully!"
      )
    );
});

export {
  getVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
