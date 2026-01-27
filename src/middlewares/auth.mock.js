// src/middlewares/auth.mock.js

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
};

exports.requireAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.toLowerCase().includes("admin")) {
    return res.status(403).json({
      message: "Forbidden - Admin only",
    });
  }

  next();
};
