import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import validator from "validator";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (user) => {
  try {
    // const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    if (!accessToken && !refreshToken) {
      throw new ApiError(
        500,
        "Something went wrong while generating Access and Refresh Token !!"
      );
    }
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token !!"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  // console.log("REQUEST BODY:",req.body);
  // Check for empty fields
  if ([username, fullName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required!");
  }

  // Check for existing user
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "Username or email already exists!");
  }

  // Handle avatar (required)
  // console.log("REQUEST FILES:",req.files);
  const avatarFiles = req.files?.avatar;
  if (!avatarFiles || avatarFiles.length === 0) {
    throw new ApiError(400, "Avatar file is required!");
  }
  const avatarLocalPath = avatarFiles[0].path;

  // Handle coverImg (optional)
  let coverImgLocalPath;
  if (req.files?.coverImg && req.files.coverImg.length > 0) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(500, "Failed to upload avatar!");
  }

  let coverImg;
  if (coverImgLocalPath) {
    coverImg = await uploadOnCloudinary(coverImgLocalPath);
    if (!coverImg?.url) {
      throw new ApiError(500, "Failed to upload cover image!");
    }
  }

  // Create user
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
  });

  // Fetch user without sensitive data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to register user!");
  }

  // Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  // validator.isEmail(emailorUsername)
  // console.log(req.body);
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email required !!");
  }
  if (!password) {
    throw new ApiError(400, "password is required !!");
  }
  const user = await User.findOne({
    $or: [{ username }, { email: email?.toLowerCase() }],
  });
  if (!user) {
    throw new ApiError(404, "Invalid Credentials !!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials !!");
  }
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);
  //   const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

  // Create response payload from existing data

  //  const userData = user.toObject();
  //  delete userData.password;
  //  delete userData.refreshToken;

  const loggedInUser = {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    coverImg: user.coverImg,
    watchHistory: user.watchHistory,
  };

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User Logged In Successfully !"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  const user = req?.user;
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      // $set:{refreshToken:undefined}
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(500, "Failed to logOut user");
  }
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Token Not Available !!");
    }
    const userfromIncomingRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(userfromIncomingRefreshToken?._id).select(
      "-password"
    );
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid RefreshToken !!");
    }
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user,
            accessToken,
            refreshToken,
          },
          "User Logged In Successfully !"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Refresh Token !!");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError(400, "Both Old and New Password Required!!");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isCorrect) {
    throw new ApiError(402, "Old Password Is Incorrect!!");
  }
  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "New Password Has Been Reset"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName?.trim() || !email?.trim()) {
    throw new ApiError(400, "At Least One Field Required!!");
  }
  const updateFields = {};
  if (fullName?.trim()) updateFields.fullName = fullName.trim();
  if (email?.trim()) {
    if (!validator.isEmail(email)) {
      throw new ApiError(400, "Invalid Email Format !!");
    }
    updateFields.email = email.toLowerCase().trim();
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(404, "user Not Found !!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User Details Updated Successfully!!")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarFile = req.file;
  console.log(req.file);
  if (!avatarFile) {
    throw new ApiError(400, "File Upload FAILED !!");
  }
  const localFilePath = avatarFile?.path;
  const response = await uploadOnCloudinary(localFilePath);
  if (!response?.url) {
    throw ApiError(500, "Failed To Upload On Cloudinary !!");
  }
  if (response) {
    deleteOnCloudinary(req.user?.avatar);
  }
  const updatedProfile = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: response?.url } },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");
  if (!updatedProfile) {
    throw new ApiError(500, "FAILED To Update Avatar!!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProfile, "Avatar Upadated Successfully!!")
    );
});
const updateCoverImg = asyncHandler(async (req, res) => {
  const coverFile = req.file;
  console.log(req.file);
  if (!coverFile) {
    throw new ApiError(400, "File Upload FAILED !!");
  }
  const localFilePath = coverFile?.path;
  const response = await uploadOnCloudinary(localFilePath);
  if (!response?.url) {
    throw ApiError(500, "Failed To Upload On Cloudinary !!");
  }
  if (response) {
    deleteOnCloudinary(req.user?.coverImg);
  }
  const updatedProfile = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImg: response?.url } },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");
  if (!updatedProfile) {
    throw new ApiError(500, "FAILED To Update CoverImg!!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProfile, "CoverImg Upadated Successfully!!")
    );
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing !!");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
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
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImg: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log("CHANNEL: ", channel);
  if (!channel?.length) {
    throw new ApiError(400, "channel does not exist!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "channel profile ftched successfully!!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ],
            },
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ],
      },
    },
  ]);
  if(!user){
    throw new ApiError(400,"user Not Found !!")
  }
  return res.status(200)
  .json(new ApiResponse(200,user[0].watchHistory||[],'User watchHistory fetched Successfully!!'))
});
export {
  registerUser,
  loginUser,  
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImg,
  getUserChannelProfile,
  getWatchHistory
};
