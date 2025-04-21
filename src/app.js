import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import { globalLimiter } from "./utils/rateLimiter.js";
// import { verifyToken } from "./middlewares/auth.middleware.js";

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "400kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "400kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// app.use(globalLimiter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

// 404 handler (optional but recommended)
// app.use((req, res, next) => {
//   next(new ApiError(404, "Route not found"));
// });

// ✅ GLOBAL ERROR HANDLER - THIS MUST BE LAST
app.use((err, req, res, next) => {
  console.log(err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});
export default app;
