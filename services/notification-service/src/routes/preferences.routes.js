const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth.middleware');
const { validatePreferencesUpdate } = require('../middlewares/validation.middleware');

const preferencesController = require('../controllers/preferences.controller');

// All routes require authentication
router.get(
  '/',
  requireAuth,
  preferencesController.get
);

router.put(
  '/',
  requireAuth,
  validatePreferencesUpdate,
  preferencesController.update
);

router.delete(
  '/',
  requireAuth,
  preferencesController.reset
);

// Additional endpoints
router.post(
  '/push-token',
  requireAuth,
  preferencesController.updatePushToken
);

router.put(
  '/phone',
  requireAuth,
  preferencesController.updatePhone
);

router.put(
  '/email',
  requireAuth,
  preferencesController.updateEmail
);

module.exports = router;

