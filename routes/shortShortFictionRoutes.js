const express = require("express");
const router = new express.Router();

const ensureAdminLogin = require("../middleware/ensureAdminLogin");
const ctrl = require("../controllers/shortShortFictionControllers");

router.post("/draft", ensureAdminLogin, ctrl.createDraft);
router.get("/", ensureAdminLogin, ctrl.list);
router.patch("/:id", ensureAdminLogin, ctrl.updateDraft);
router.post("/:id/publish", ensureAdminLogin, ctrl.publish);
router.delete("/:id", ensureAdminLogin, ctrl.delete);

module.exports = router;
