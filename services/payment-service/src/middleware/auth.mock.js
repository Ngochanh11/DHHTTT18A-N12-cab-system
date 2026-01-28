export const mockAuth = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // mock user
  req.user = {
    id: "user_001",
    role: "USER" // USER | DRIVER | ADMIN
  };

  next();
};
