const express = require("express");
const router = new express.Router();
const ensureAdmin = require("../middleware/ensureAdmin");
const poems = require("../controllers/poemControllers");

router.post("/draft", ensureAdmin, poems.createDraft);
router.get("/", ensureAdmin, poems.listPoems);
router.get("/:id", ensureAdmin, poems.getPoem);
router.patch("/:id", ensureAdmin, poems.updateDraft);
router.post("/:id/publish", ensureAdmin, poems.publishPoem);
router.delete("/:id", ensureAdmin, poems.deletePoem);

module.exports = router;
