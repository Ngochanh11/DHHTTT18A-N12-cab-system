const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const verifyToken = require("../middleware/authMiddleware"); // Middleware bảo mật

// Áp dụng verifyToken cho toàn bộ endpoint bên dưới
router.use(verifyToken);

router.get("/active", rideController.getActiveRide);
router.get("/:rideId", rideController.getRideById);
router.get("/:rideId/route", rideController.getRoute);
router.get("/:rideId/tracking", rideController.getRideById);
router.put("/:rideId/status", rideController.updateStatus);
router.put("/:rideId/location", rideController.updateLocationHTTP);
router.post("/:rideId/sos", rideController.sendSOS);

module.exports = router;
