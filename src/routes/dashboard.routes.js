import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router =Router();

router.get("/get-channel-stat",verifyToken,getChannelStats);
router.get("/get-channel-videos",verifyToken,getChannelVideos);

export default router;