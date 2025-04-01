import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";


const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;

    // Check for empty fields
    if ([username, fullName, email, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required!");
    }

    // Check for existing user
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "Username or email already exists!");
    }

    // Handle avatar (required)
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
        coverImg: coverImg?.url || ""
    });

    // Fetch user without sensitive data
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Failed to register user!");
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully!")
    );
});
export { registerUser }