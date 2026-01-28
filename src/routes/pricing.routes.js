const router = require("express").Router();

const pricing = require("../services/pricing.service");
const surge = require("../services/surge.service");
const config = require("../services/config.service");
const vehicle = require("../services/vehicle.service");
const ai = require("../services/ai-pricing.service");
const { requireAuth, requireAdmin } = require("../middlewares/auth.mock");

router.post("/estimate", pricing.estimate);

router.get("/surge/:zoneId", requireAuth, surge.getSurge);
router.put("/surge/:zoneId", requireAdmin, surge.updateSurge);
router.get("/surge/zones", requireAuth, surge.listZones);

router.get("/config", requireAdmin, config.getConfig);
router.put("/config", requireAdmin, config.updateConfig);

router.get("/vehicle-types", requireAuth, vehicle.getVehicleTypes);

router.post("/dynamic", ai.calculateDynamicPrice);

module.exports = router;
