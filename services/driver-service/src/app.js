require("dotenv").config();
const express = require("express");
const cors = require("cors");
const driverRoutes = require("./routes/driver.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/api/v1/drivers", driverRoutes);

const PORT = 3003;
app.listen(PORT, () =>
  console.log(`Driver Service running on port ${PORT}`)
);
