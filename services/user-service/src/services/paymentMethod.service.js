const User = require('../models/user.model');


exports.getAll = async(id) => {
    return (await User.findById(id)).paymentMethods;
};


exports.create = async(id, data) => {
    const user = await User.findById(id);
    user.paymentMethods.push(data);
    await user.save();
    return user.paymentMethods;
};


exports.remove = async(id, methodId) => {
    const user = await User.findById(id);
    user.paymentMethods.id(methodId).remove();
    await user.save();
    return { message: 'Payment method deleted' };
};