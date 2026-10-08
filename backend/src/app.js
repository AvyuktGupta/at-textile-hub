import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import { UPLOADS_URL_PREFIX, uploadsDir } from "./config/paths.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";
import ApiError from "./utils/ApiError.js";

const app = express();

// Behind Nginx / a load balancer on the VPS, so trust the first proxy hop for client IPs.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(env.isProduction ? "combined" : "dev"));

// Upload filenames are random and never reused, so they can be cached aggressively.
app.use(
  UPLOADS_URL_PREFIX,
  express.static(uploadsDir, { maxAge: "365d", immutable: true, index: false, fallthrough: false })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
