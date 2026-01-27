const User = require('../models/user.model');


exports.getAll = async(id) => {
    return (await User.findById(id)).locations;
};


exports.create = async(id, data) => {
    const user = await User.findById(id);
    user.locations.push(data);
    await user.save();
    return user.locations;
};


exports.remove = async(id, locationId) => {
    const user = await User.findById(id);
    user.locations.id(locationId).remove();
    await user.save();
    return { message: 'Location deleted' };
};