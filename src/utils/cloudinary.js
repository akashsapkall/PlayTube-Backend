import { v2 as cloudinary } from "cloudinary";
// import { v4 as uuidv4 } from "uuid";
import { randomUUID } from "crypto";
import fs from "fs";
import streamifier from "streamifier";

function configCloudinary(){
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
const uploadOnCloudinary = async (localFilePath,folderName) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder:folderName,
    });
    // console.log("CLOUDINARY RESPONSE:",response);
    if(response.url){
        fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    console.log("file uploaded to cloudinary failed ");
    fs.unlinkSync(localFilePath);
    return null;
  }
};
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result.result === 'ok';
  } catch (error) {
    console.error("Delete failed:", error);
    return false;
  }
};


const uploadVideoAndThumbnailOnCloudinary=async (buffer, resourceType, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: resourceType,
      folder: folderName,
      public_id: `${folderName}/${randomUUID()}`, // Unique filename
      overwrite: false, // Prevent accidental overwrites
      chunk_size: 50 * 1024 * 1024 // 50MB chunks for video
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
export { configCloudinary, uploadOnCloudinary, deleteFromCloudinary, uploadVideoAndThumbnailOnCloudinary };