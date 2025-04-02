// npm install express-rate-limit

// utils/rateLimiter.js
import rateLimit from "express-rate-limit";

// Global rate limiter (for all routes)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable deprecated headers
});

// Strict limiter for sensitive routes (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, try again later",
});


// npm install rate-limit-redis

// import RedisStore from "rate-limit-redis";
// import redisClient from "./redisClient.js";

// export const apiLimiter = rateLimit({
//   store: new RedisStore({
//     client: redisClient,
//     prefix: "ratelimit:",
//   }),
//   windowMs: 60 * 1000, // 1 minute
//   max: 60,
// });


// // app.js
// import helmet from "helmet";

// // Basic setup (recommended for all apps)
// app.use(helmet());

// // Custom configuration (example)
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "trusted-cdn.com"],
//     },
//   },
//   frameguard: { action: "deny" }
// }));