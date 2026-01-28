const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const upload = require("../utils/upload");
const c = require("../controllers/driver.controller");

router.get("/", auth, role(["admin"]), c.getAllDrivers);
router.post("/register", auth, c.registerDriver);

router.get("/nearby", auth, c.findNearbyDrivers);

router.get("/:driverId", auth, c.getDriverById);
router.put("/:driverId", auth, role(["driver"]), c.updateDriver);

router.post("/:driverId/documents", auth, role(["driver"]),
  upload.single("document"), c.uploadDocument);
router.get("/:driverId/documents", auth, c.getDocuments);

router.put("/:driverId/status", auth, role(["driver"]), c.updateStatus);

router.get("/:driverId/earnings", auth, role(["driver"]), c.getEarnings);
router.get("/:driverId/earnings/daily", auth, role(["driver"]), c.getDailyEarnings);

router.get("/:driverId/rides", auth, role(["driver"]), c.getRides);
router.get("/:driverId/rating", auth, c.getRating);

router.post("/:driverId/vehicle", auth, role(["driver"]), c.upsertVehicle);
router.get("/:driverId/vehicle", auth, c.getVehicle);

module.exports = router;
