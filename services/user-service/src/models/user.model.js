const mongoose = require('mongoose');


const WalletSchema = new mongoose.Schema({
    balance: { type: Number, default: 0 },
    transactions: [{
        type: { type: String },
        amount: Number,
        date: { type: Date, default: Date.now }
    }]
});


const LocationSchema = new mongoose.Schema({
    name: String,
    address: String,
    lat: Number,
    lng: Number
});


const PaymentMethodSchema = new mongoose.Schema({
    type: String,
    details: Object
});


const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    profile: {
        bio: String
    },
    wallet: WalletSchema,
    locations: [LocationSchema],
    paymentMethods: [PaymentMethodSchema],
    isDeleted: { type: Boolean, default: false }
});


module.exports = mongoose.model('User', UserSchema);