const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const rideRoutes = require("./routes/rideRoutes");
const initSocketServer = require("./socket/rideSocket");

dotenv.config();

// --- 1. HTTP Server (Port 3005) ---
const app = express();
app.use(cors());
app.use(express.json());

connectDB(); // Kết nối DB

app.use("/api/v1/rides", rideRoutes); // Routes

const HTTP_PORT = process.env.HTTP_PORT || 3005;
app.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP API running on port ${HTTP_PORT}`);
});

// --- 2. WebSocket Server (Port 3006) ---
const socketApp = http.createServer();
const io = initSocketServer(socketApp);

const WS_PORT = process.env.WS_PORT || 3006;
socketApp.listen(WS_PORT, () => {
  console.log(`✅ WebSocket running on port ${WS_PORT} (Endpoint: /ws/driver)`);
});
