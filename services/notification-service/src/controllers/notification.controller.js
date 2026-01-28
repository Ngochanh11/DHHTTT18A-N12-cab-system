const notificationService = require('../services/notification.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Notification Controller
 * Handles all notification-related endpoints
 */
class NotificationController {
  /**
   * GET /api/v1/notifications
   * Get user notifications with pagination and filters
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit, unreadOnly, type } = req.query;

      const result = await notificationService.getByUser(userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        unreadOnly: unreadOnly === true || unreadOnly === 'true',
        type: type || null
      });

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: result.pagination
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/:notificationId
   * Get a single notification by ID
   */
  async getNotificationById(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await notificationService.getById(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: { notification },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/:notificationId/read
   * Mark a notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await notificationService.markAsRead(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread/count
   * Get unread notification count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count: result.count },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:notificationId
   * Delete a notification
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const deleted = await notificationService.delete(notificationId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications
   * Delete all notifications for a user
   */
  async deleteAll(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await notificationService.deleteAll(userId);

      res.json({
        success: true,
        message: 'All notifications deleted',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /internal/notifications (Internal endpoint)
   * Send notification from other services
   */
  async createInternal(req, res, next) {
    try {
      const { userId, type, title, body, data, channels, metadata } = req.body;

      if (!userId || !type || !title || !body) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId, type, title, and body are required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const notification = await notificationService.create({
        userId,
        type,
        title,
        body,
        data: data || {},
        channels: channels || ['push'],
        metadata: { ...metadata, source: 'internal', requestId: uuidv4() }
      });

      if (!notification) {
        return res.status(200).json({
          success: true,
          message: 'Notification was suppressed due to user preferences',
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: { notification },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

