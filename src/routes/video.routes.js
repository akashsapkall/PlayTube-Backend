import { Router } from "express";
import { uploadMemory } from "../middlewares/multer.middleware.js";
import {
  getVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.post(
  "/publish-video",
  verifyToken,
  uploadMemory.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.get("/get-videos", verifyToken, getVideos);
router.get('/get-video/:videoId', verifyToken, getVideoById);
router.patch('/update-video/:videoId', verifyToken,uploadMemory.single("thumbnail") ,updateVideo);
router.patch("/update-video-publish-status/:videoId",verifyToken,togglePublishStatus);
router.delete("/delete-video/:videoId",verifyToken,deleteVideo);
export default router;