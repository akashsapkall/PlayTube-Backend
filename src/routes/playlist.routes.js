import { Router } from "express";
import {
  createPlaylist,
  getUsersAllPlaylists,
  getUsersPublicPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-playlist", verifyToken, createPlaylist);
router.get("/get-users-playlists", verifyToken, getUsersAllPlaylists);
router.get("/get-users-public-playlists/:userId", verifyToken, getUsersPublicPlaylists);
router.get("/get-playlist/:playlistId", verifyToken, getPlaylistById);
router.delete("/delete-playlist/:playlistId", verifyToken, deletePlaylist);
router.patch("/update-playlist/:playlistId", verifyToken, updatePlaylist);
router.patch("/add-video-to-playlist/:videoId/:playlistId", verifyToken, addVideoToPlaylist);
router.patch("/remove-video-from-playlist/:videoId/:playlistId", verifyToken, removeVideoFromPlaylist);

export default router;
