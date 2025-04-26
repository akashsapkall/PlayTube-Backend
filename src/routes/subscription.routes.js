import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router =Router();

router.get("/:channelId/toggel-subscription",verifyToken,toggleSubscription);
router.get("/get-subscribers",verifyToken,getUserChannelSubscribers);
router.get("/get-subscribed-channels",verifyToken,getSubscribedChannels);

export default router;