module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: 'Missing token' });
  }

  // Mock decode token - in production, use JWT verification
  req.user = {
    id: 'user-123',
    role: auth.includes('driver') ? 'driver' : 'user'
  };

  next();
};

