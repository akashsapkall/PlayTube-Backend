import { Router } from "express";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
} from "../controllers/like.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/videos/:videoId", verifyToken, toggleVideoLike);

router.post("/comments/:commentId", verifyToken, toggleCommentLike);

router.post("/tweets/:tweetId", verifyToken, toggleTweetLike);
router.get("/get-liked-videos", verifyToken, getLikedVideos);

export default router;
