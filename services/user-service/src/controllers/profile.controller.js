const service = require('../services/profile.service');

exports.getProfile = async(req, res) => {
    const profile = await service.get(req.params.userId);
    res.json(profile);
};

exports.updateProfile = async(req, res) => {
    const profile = await service.update(req.params.userId, req.body);
    res.json(profile);
};