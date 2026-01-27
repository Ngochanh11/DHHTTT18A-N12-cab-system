module.exports = (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({ message: 'Missing token' });
    }

    req.user = {
        id: 'user-123',
        role: auth.includes('admin') ? 'admin' : 'user'
    };

    next();
};