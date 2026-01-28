const { Server } = require("socket.io");
const { redisClient, producer } = require("../config/clients");

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/ws/driver", // Endpoint đúng theo tài liệu
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket Connected: ${socket.id}`);

    // 1. App Khách hàng đăng ký nhận tin cập nhật chuyến đi
    socket.on("subscribe_ride", (rideId) => {
      socket.join(`ride_${rideId}`);
    });

    // 2. Tài xế gửi vị trí GPS
    socket.on("location_update", async (data) => {
      const { rideId, driverId, lat, lng } = data;
      try {
        // A. Lưu vào Redis Geo (Để tìm kiếm "xe gần đây" sau này)
        await redisClient.geoAdd("drivers:locations", {
          point: { longitude: lng, latitude: lat },
          member: driverId,
        });

        // B. Gửi vị trí cho Khách hàng (Real-time)
        io.to(`ride_${rideId}`).emit("driver_location", { lat, lng, driverId });

        // C. Bắn Kafka Event (Cho các service khác như ETA/Monitoring)
        await producer.send({
          topic: "driver.location.updated",
          messages: [
            {
              value: JSON.stringify({
                rideId,
                driverId,
                lat,
                lng,
                timestamp: Date.now(),
              }),
            },
          ],
        });
      } catch (err) {
        console.error("Socket Error:", err);
      }
    });
  });

  return io;
};

module.exports = initSocketServer;
