import { ApiError } from "../utils/apiError.js"
import jwt from 'jsonwebtoken';
// import User from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyToken=asyncHandler((req, _, next)=>{
    try {
        const accessToken=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!accessToken){
        throw new ApiError(401,"Authorization Required !!");
        }
        const user=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
        // const user=await User.findById(decodedUser?._id).select("-password -refreshToken");
        // useless as verify throws error or give user
        req.user=user;
        return next();
    } catch (error) {
        let message = "Authorization Required !!";
        if (error.name === "TokenExpiredError") message = "Token expired";
        if (error.name === "JsonWebTokenError") message = "Malformed token";
        
        throw new ApiError(401, message);
    }
})
export { verifyToken }