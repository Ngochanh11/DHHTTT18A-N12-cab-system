const userService = require('../services/user.service');

exports.getAllUsers = async(req, res) => {
    const users = await userService.getAll();
    res.json(users);
};

exports.getUserById = async(req, res) => {
    const user = await userService.getById(req.params.userId);
    res.json(user);
};

exports.updateUser = async(req, res) => {
    const user = await userService.update(req.params.userId, req.body);
    res.json(user);
};

exports.deleteUser = async(req, res) => {
    await userService.remove(req.params.userId);
    res.json({ message: 'User deleted' });
};