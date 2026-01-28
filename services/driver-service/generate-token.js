const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey";

// Token cho DRIVER
const driverToken = jwt.sign(
  { id: "driver-user-1", role: "driver" },
  SECRET,
  { expiresIn: "1d" }
);

// Token cho ADMIN
const adminToken = jwt.sign(
  { id: "admin-1", role: "admin" },
  SECRET,
  { expiresIn: "1d" }
);

console.log("DRIVER TOKEN:");
console.log(driverToken);
console.log("\nADMIN TOKEN:");
console.log(adminToken);
