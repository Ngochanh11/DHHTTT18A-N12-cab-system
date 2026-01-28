const User = require('../models/user.model');


exports.get = async(userId) => {
    const user = await User.findById(userId);
    return user.profile;
};


exports.update = async(userId, data) => {
    const user = await User.findById(userId);
    user.profile = data;
    await user.save();
    return user.profile;
};