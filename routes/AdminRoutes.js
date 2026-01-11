// backend/routes/AdminRoutes.js
const express = require("express");
const router = express.Router();

// controller (plural file name as you said)
const adminController = require("../controllers/adminControllers");

// middleware: use the actual export name and create an alias
const { requireAdminAuth } = require("../middleware/auth");
const requireAdmin = requireAdminAuth;

// Public
router.post("/login", adminController.login);
router.post("/register", adminController.register); // optional

// Protected
router.get("/me", requireAdmin, adminController.me);
router.post("/logout", requireAdmin, adminController.logout);

module.exports = router;
