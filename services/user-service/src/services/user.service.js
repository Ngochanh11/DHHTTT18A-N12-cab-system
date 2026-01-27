// src/services/user.service.js
const User = require('../models/user.model');
const mongoose = require('mongoose');

exports.getAll = async() => {
    return await User.find({ isDeleted: false });
};

exports.getById = async(id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid userId');
    }

    return await User.findOne({
        _id: id,
        isDeleted: false
    });
};

exports.update = async(id, data) => {
    return await User.findByIdAndUpdate(
        id,
        data, { new: true }
    );
};

exports.remove = async(id) => {
    return await User.findByIdAndUpdate(
        id, { isDeleted: true }
    );
};