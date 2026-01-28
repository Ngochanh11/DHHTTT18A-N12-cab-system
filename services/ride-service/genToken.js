const jwt = require("jsonwebtoken");
require("dotenv").config();

const payload = {
  id: "user_123", // Giả lập ID người dùng
  role: "DRIVER", // Giả lập quyền Tài xế
  name: "Nguyen Van A",
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
console.log("\nCopy Token bên dưới để test:");
console.log("Bearer " + token);
console.log("\n");
