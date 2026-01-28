const service = require('../services/wallet.service');

exports.getWallet = async(req, res) => {
    res.json(await service.getWallet(req.params.userId));
};

exports.topup = async(req, res) => {
    res.json(await service.topup(req.params.userId, req.body.amount));
};

exports.withdraw = async(req, res) => {
    res.json(await service.withdraw(req.params.userId, req.body.amount));
};

exports.getTransactions = async(req, res) => {
    res.json(await service.transactions(req.params.userId));
};