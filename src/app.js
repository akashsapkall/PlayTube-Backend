import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import { globalLimiter } from "./utils/rateLimiter.js";
import { verifyToken } from "./middlewares/auth.middleware.js";

import userRouter from './routes/user.routes.js';

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
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
app.use('/api/v1/users',userRouter);
export default app;
