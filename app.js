require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const path = require("path");

const routes = require("./routes");
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenRequestError,
} = require("./expressError");

const app = express();

// TRUST PROXY (before session)
app.set("trust proxy", 1);

// DB pool and session constants
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const isProd = process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

// SECURITY + LOGGING (early)
app.use(helmet());
app.use(morgan("tiny"));

// BODY PARSING (before routes)
app.use(express.json());

// CORS (before routes and preflight)
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
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.options(/.*/, cors());

// SESSION (must be before routes that use req.session)
app.use(
  session({
    name: isProd ? "__Host-ir_session" : "ir_session",
    secret: SESSION_SECRET,
    store: new PgSession({ pool: pgPool }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    },
  })
);



// API routes (after session + CORS)
app.use("/api", routes);

// Static SPA fallback (serve client, but exclude /api)
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// 404 and error handlers (last)
app.use((req, res, next) => next(new NotFoundError()));
app.use((err, req, res, next) => {
  if (err instanceof ExpressError) {
    return res.status(err.status || 500).json({ error: err.message });
  }
  if (err && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message || "Validation error" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
