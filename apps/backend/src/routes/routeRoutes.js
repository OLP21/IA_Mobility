const express = require("express");
const router = express.Router();

const routeController = require("../controllers/routeController");

router.post("/route", routeController.getRoute);
router.get("/routes", routeController.getRoutesHistory);

module.exports = router;