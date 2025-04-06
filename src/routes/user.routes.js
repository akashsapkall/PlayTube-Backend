import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
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
  getWatchHistory,
} from "../controllers/user.controller.js";
// import { authLimiter } from "../utils/rateLimiter.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImg",
      maxCount: 1,
    },
  ]),
  registerUser
);
// router.post("/login",authLimiter,loginUser);
router.post("/login", loginUser);
router.post("/logout", verifyToken, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/changepassword", verifyToken, changeCurrentPassword);
router.get("/getuser", getCurrentUser);
router.patch("/updateuser", verifyToken, updateAccountDetails);
router.patch(
  "/updateavatar",
  verifyToken,
  upload.single("avatar"),
  updateAvatar
);
router.patch(
  "/updatecoverimg",
  verifyToken,
  upload.single("coverImg"),
  updateCoverImg
);
router.get("/:username", verifyToken, getUserChannelProfile);
router.get("/watch-history", verifyToken, getWatchHistory);
export default router;
