const service = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const result = await service.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    res.json(result.notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await service.markAsRead(req.params.notificationId, req.user.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await service.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const result = await service.getUnreadCount(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const preferences = await service.getNotificationPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ message: 'Failed to get preferences' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const preferences = await service.updateNotificationPreferences(req.user.id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const notification = await service.sendNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
};

