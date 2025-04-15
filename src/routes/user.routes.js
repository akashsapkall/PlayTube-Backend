import { Router } from "express";
import { uploadDisc } from "../middlewares/multer.middleware.js";
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
  uploadDisc.fields([
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
  uploadDisc.single("avatar"),
  updateAvatar
);
router.patch(
  "/updatecoverimg",
  verifyToken,
  uploadDisc.single("coverImg"),
  updateCoverImg
);
router.get("/watch-history", verifyToken, getWatchHistory);
router.get("/:username", verifyToken, getUserChannelProfile);
export default router;
