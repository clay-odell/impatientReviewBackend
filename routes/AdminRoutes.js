const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers");
const requireAdmin = require("../middleware/auth").requireAdminAuth;

// Public
router.post("/login", adminController.login);
router.post("/register", adminController.register); // optional

// Protected
router.get("/me", requireAdmin, adminController.me);
router.post("/logout", requireAdmin, adminController.logout);

module.exports = router;
