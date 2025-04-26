import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";


const router = Router();
router.get("/get-video-comment/:videoId",verifyToken,getVideoComments);
router.post("/add-comment/:videoId",verifyToken,addComment);
router.patch("/update-comment/:commentId",verifyToken,updateComment);
router.delete("/delete-comment/:commentId",verifyToken,deleteComment);

export default router;
