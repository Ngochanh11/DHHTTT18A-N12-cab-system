const service = require('../services/paymentMethod.service');

exports.getAll = async(req, res) => {
    res.json(await service.getAll(req.params.userId));
};

exports.create = async(req, res) => {
    res.json(await service.create(req.params.userId, req.body));
};

exports.remove = async(req, res) => {
    res.json(await service.remove(req.params.userId, req.params.methodId));
};