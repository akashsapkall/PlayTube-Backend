import { Router } from "express";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router =Router();

router.post("/create-tweet",verifyToken,createTweet);
router.get("/get-tweets",verifyToken,getUserTweets);
router.patch("/update-tweet/:tweetId",verifyToken,updateTweet);
router.delete("/delete-tweet/:tweetId",verifyToken,deleteTweet);

export default router;