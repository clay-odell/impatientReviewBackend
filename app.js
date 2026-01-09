require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const path = require("path"); // ✅ Needed for SPA fallback

const routes = require("./routes");
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenRequestError,
} = require("./expressError");

const app = express();

// ------------------------------------------------------------
// TRUST PROXY (required for secure cookies behind nginx/HTTPS)
// ------------------------------------------------------------
app.set("trust proxy", 1);

// ------------------------------------------------------------
// SESSION STORE (required for login to work)
// ------------------------------------------------------------
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const isProd = process.env.NODE_ENV === "production";

// Ensure SESSION_SECRET exists in production
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

app.use(
  session({
    name: isProd ? "__Host-ir_session" : "ir_session",
    store: new pgSession({
      pool: pgPool,
      tableName: "session",
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd, // requires HTTPS in production
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    },
  })
);

// ------------------------------------------------------------
// STANDARD MIDDLEWARE
// ------------------------------------------------------------
app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "https://impatientreview.com,https://api.impatientreview.com"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server or tools like curl (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        // echo the origin when credentials are allowed
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ensure preflight is handled for all routes
app.options("*", cors());

// ------------------------------------------------------------
// API ROUTES
// ------------------------------------------------------------
app.use("/api", routes);

// ------------------------------------------------------------
// 404 HANDLER
// ------------------------------------------------------------
app.use((req, res, next) => {
  next(new NotFoundError());
});

// ------------------------------------------------------------
// CENTRAL ERROR HANDLER
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err instanceof ExpressError) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }

  if (err && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message || "Validation error" });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
