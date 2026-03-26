const express = require("express");
const router = express.Router();

const routeController = require("../controllers/routeController");
const { requireAuth } = require("../middleware");

router.post("/route", requireAuth, routeController.getRoute);
router.get("/routes", requireAuth, routeController.getRoutesHistory);
router.get("/routes/:id", requireAuth, routeController.getRouteById);

module.exports = router;