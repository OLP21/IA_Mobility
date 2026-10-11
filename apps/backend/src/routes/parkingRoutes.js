const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");

// Point d'entrée REST pour l'IA ou les autres services
router.post("/predictions", parkingController.savePrediction);

module.exports = router;
