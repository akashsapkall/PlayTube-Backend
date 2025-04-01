import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";


const registerUser=asyncHandler(async(req, res)=>{
    const { username, fullName, email, password } =req.body;
    if([username, fullName, email, password].some((ele)=>ele?.trim() === "")){
        throw new ApiError(400,"All Fields Required !!");
    }

    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser){ 
        throw new ApiError(409,"username or email already exists !!");
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImgLocalPath=req.files?.coverImg[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is Required !!");
    }
    const avatar =await uploadOnCloudinary(avatarLocalPath);
    let coverImg;
    if(coverImgLocalPath){
        coverImg=await uploadOnCloudinary(coverImgLocalPath);
    }
    if(!avatar){
        throw new ApiError(400,"Avatar is Required !!");
    }
    const user= await User.create({
        fullName,
        username:username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImg:coverImg?.url || ""
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user !!");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registerd Successfully !")
    )
});

export { registerUser }