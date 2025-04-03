import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
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
router.post("/login",loginUser);
router.post("/logout",verifyToken,logoutUser);
export default router;
