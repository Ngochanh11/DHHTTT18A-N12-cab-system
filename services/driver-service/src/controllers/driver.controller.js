const drivers = require("../data/drivers");

/* ================= REGISTER ================= */
exports.registerDriver = (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required" });
  }

  const exists = drivers.find(d => d.phone === phone);
  if (exists) {
    return res.status(400).json({ message: "Driver already exists" });
  }

  const newDriver = {
    id: req.user.id,
    name,
    phone,
    status: "offline",
    rating: 0,
    documents: [],
    vehicle: null,
    earnings: {
      total: 0,
      daily: {}
    },
    rides: [],
    location: null,
    createdAt: new Date()
  };

  drivers.push(newDriver);
  res.status(201).json(newDriver);
};

/* ================= GET ALL ================= */
exports.getAllDrivers = (req, res) => {
  res.json(drivers);
};

/* ================= GET BY ID ================= */
exports.getDriverById = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  res.json(driver);
};

/* ================= UPDATE DRIVER ================= */
exports.updateDriver = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  const { name, phone } = req.body;
  if (name) driver.name = name;
  if (phone) driver.phone = phone;

  res.json(driver);
};

/* ================= DOCUMENTS ================= */
exports.uploadDocument = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  if (!req.file || !req.body.type) {
    return res.status(400).json({ message: "File & type required" });
  }

  const doc = {
    id: "doc-" + Date.now(),
    type: req.body.type,
    file: req.file.filename,
    uploadedAt: new Date()
  };

  driver.documents.push(doc);
  res.status(201).json(doc);
};

exports.getDocuments = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  res.json(driver.documents);
};

/* ================= STATUS ================= */
exports.updateStatus = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  const { status } = req.body;
  if (!["online", "offline"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  driver.status = status;
  res.json({ status });
};

/* ================= EARNINGS ================= */
exports.getEarnings = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  res.json(driver.earnings);
};

exports.getDailyEarnings = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  const { date } = req.query;
  res.json({
    date,
    total: driver.earnings.daily[date] || 0
  });
};

/* ================= RIDES ================= */
exports.getRides = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  res.json(driver.rides);
};

/* ================= RATING ================= */
exports.getRating = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  res.json({
    average: driver.rating,
    totalReviews: 100
  });
};

/* ================= VEHICLE ================= */
exports.upsertVehicle = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  driver.vehicle = req.body;
  res.json(driver.vehicle);
};

exports.getVehicle = (req, res) => {
  const driver = drivers.find(d => d.id === req.params.driverId);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  res.json(driver.vehicle);
};

/* ================= NEARBY ================= */
exports.findNearbyDrivers = (req, res) => {
  const onlineDrivers = drivers.filter(d => d.status === "online");
  res.json(onlineDrivers);
};
