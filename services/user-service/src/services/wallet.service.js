const User = require('../models/user.model');


exports.getWallet = async(id) => {
    return (await User.findById(id)).wallet;
};


exports.topup = async(id, amount) => {
    const user = await User.findById(id);
    user.wallet.balance += amount;
    user.wallet.transactions.push({ type: 'TOPUP', amount });
    await user.save();
    return user.wallet;
};


exports.withdraw = async(id, amount) => {
    const user = await User.findById(id);
    user.wallet.balance -= amount;
    user.wallet.transactions.push({ type: 'WITHDRAW', amount });
    await user.save();
    return user.wallet;
};


exports.transactions = async(id) => {
    return (await User.findById(id)).wallet.transactions;
};