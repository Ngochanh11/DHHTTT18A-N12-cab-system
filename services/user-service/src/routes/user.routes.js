// src/routes/user.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

const userController = require('../controllers/user.controller');
const profileController = require('../controllers/profile.controller');
const walletController = require('../controllers/wallet.controller');
const locationController = require('../controllers/location.controller');
const paymentController = require('../controllers/paymentMethod.controller');

/* USERS */
router.get('/', auth, role('admin'), userController.getAllUsers);
router.get('/:userId', auth, userController.getUserById);
router.put('/:userId', auth, userController.updateUser);
router.delete('/:userId', auth, role('admin'), userController.deleteUser);

/* PROFILE */
router.get('/:userId/profile', auth, profileController.getProfile);
router.put('/:userId/profile', auth, profileController.updateProfile);

/* WALLET */
router.get('/:userId/wallet', auth, walletController.getWallet);
router.post('/:userId/wallet/topup', auth, walletController.topup);
router.post('/:userId/wallet/withdraw', auth, walletController.withdraw);
router.get('/:userId/wallet/transactions', auth, walletController.getTransactions);

/* SAVED LOCATIONS */
router.get('/:userId/saved-locations', auth, locationController.getAll);
router.post('/:userId/saved-locations', auth, locationController.create);
router.delete('/:userId/saved-locations/:locationId', auth, locationController.remove);

/* PAYMENT METHODS */
router.get('/:userId/payment-methods', auth, paymentController.getAll);
router.post('/:userId/payment-methods', auth, paymentController.create);
router.delete('/:userId/payment-methods/:methodId', auth, paymentController.remove);

module.exports = router;