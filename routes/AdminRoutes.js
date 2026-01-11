// backend/routes/AdminRoutes.js
const express = require("express");
const router = express.Router();

// controller (adjust path/case if your file differs)
const adminController = require("../controllers/adminControllers");

// middleware: support both named export shapes
// - if auth.js exports { requireAdmin } or { requireAdminAuth }
// - if auth.js exports a default function, requireAdmin will be that function
let requireAdmin;
try {
  const auth = require("../middleware/auth");
  requireAdmin = auth.requireAdmin || auth.requireAdminAuth || auth;
} catch (e) {
  console.error("Failed to require middleware/auth:", e);
  // fallback no-op that returns 500 so server doesn't crash on startup
  requireAdmin = (req, res, next) => res.status(500).json({ error: "Auth middleware missing" });
}

// Guard wrapper to avoid "argument handler must be a function" crashes
function guard(fn, name = "<unknown>") {
  return function (req, res, next) {
    if (typeof fn !== "function") {
      console.error(`Route handler not a function for ${name}:`, fn);
      return res.status(500).json({ error: "Server misconfiguration" });
    }
    try {
      return fn(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

// Public
router.post("/login", guard(adminController.login, "adminController.login"));
router.post("/register", guard(adminController.register, "adminController.register")); // optional

// Protected
router.get("/me", guard(requireAdmin, "requireAdmin"), guard(adminController.me, "adminController.me"));
router.post("/logout", guard(requireAdmin, "requireAdmin"), guard(adminController.logout, "adminController.logout"));

module.exports = router;
