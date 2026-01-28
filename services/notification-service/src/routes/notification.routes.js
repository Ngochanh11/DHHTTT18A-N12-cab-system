const express = require('express');
const router = express.Router();

const { authMiddleware, requireAuth } = require('../middlewares/auth.middleware');
const { 
  validatePagination, 
  validateNotificationId,
  validateNotificationCreate,
  validateUnreadOnly 
} = require('../middlewares/validation.middleware');

const notificationController = require('../controllers/notification.controller');

// Public routes (with optional auth)
// router.get('/', authMiddleware, validatePagination, notificationController.getNotifications);

// Authenticated routes
router.get(
  '/',
  requireAuth,
  validatePagination,
  validateUnreadOnly,
  notificationController.getNotifications
);

router.get(
  '/unread/count',
  requireAuth,
  notificationController.getUnreadCount
);

router.get(
  '/:notificationId',
  requireAuth,
  validateNotificationId,
  notificationController.getNotificationById
);

router.put(
  '/:notificationId/read',
  requireAuth,
  validateNotificationId,
  notificationController.markAsRead
);

router.put(
  '/read-all',
  requireAuth,
  notificationController.markAllAsRead
);

router.delete(
  '/:notificationId',
  requireAuth,
  validateNotificationId,
  notificationController.delete
);

router.delete(
  '/',
  requireAuth,
  notificationController.deleteAll
);

module.exports = router;

