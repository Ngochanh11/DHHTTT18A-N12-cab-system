const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/notification.controller');

// Public notification endpoints (internal use by other services)
router.post('/internal/notifications', ctrl.sendNotification);

// Protected notification endpoints (require authentication)
router.get('/', auth, ctrl.getNotifications);
router.get('/unread/count', auth, ctrl.getUnreadCount);
router.put('/read-all', auth, ctrl.markAllAsRead);
router.put('/:notificationId/read', auth, ctrl.markAsRead);

// Preferences endpoints
router.get('/preferences', auth, ctrl.getPreferences);
router.put('/preferences', auth, ctrl.updatePreferences);

module.exports = router;

