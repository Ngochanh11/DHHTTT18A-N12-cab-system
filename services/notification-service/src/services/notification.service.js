const Notification = require('../models/notification.model');
const Preferences = require('../models/preferences.model');
const config = require('../config');

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async create(notificationData) {
    try {
      const {
        userId,
        type,
        title,
        body,
        data = {},
        channels = ['push'],
        metadata = {}
      } = notificationData;

      // Check user preferences
      const preferences = await Preferences.getOrCreate(userId);
      
      // Check if notification type is enabled
      const typeKey = this.getNotificationTypeKey(type);
      if (preferences.notifications[typeKey]?.enabled === false) {
        console.log(`📱 Notification type '${type}' is disabled for user ${userId}`);
        return null;
      }

      // Create notification
      const notification = await Notification.create({
        userId,
        type,
        title,
        body,
        data,
        channels,
        metadata,
        isSent: false,
        sentAt: null
      });

      console.log(`✅ Notification created: ${notification._id} for user ${userId}`);
      
      // Trigger push notification (async)
      this.sendPushNotification(notification, preferences);

      return notification;

    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated notifications
   */
  async getByUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = config.pagination.defaultLimit,
        unreadOnly = false,
        type = null
      } = options;

      const skip = (page - 1) * limit;
      const query = { userId };

      if (unreadOnly) {
        query.isRead = false;
      }

      if (type) {
        query.type = type;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query)
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + notifications.length < total
        }
      };

    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get a single notification by ID
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Notification or null
   */
  async getById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      }).lean();

      return notification;

    } catch (error) {
      console.error('❌ Error getting notification by ID:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Updated notification or null
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      if (!notification) {
        return null;
      }

      await notification.markAsRead();
      
      // Invalidate cache
      await this.invalidateUnreadCache(userId);

      return notification;

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Result with count
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);
      
      // Invalidate cache
      await this.invalidateUnreadCache(userId);

      return {
        modifiedCount: result.modifiedCount || 0,
        message: 'All notifications marked as read'
      };

    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      // Try to get from cache first
      const cacheKey = `${config.redis.keyPrefix}unread:${userId}`;
      const cached = await this.getFromCache(cacheKey);

      if (cached) {
        return { count: parseInt(cached), source: 'cache' };
      }

      // Get from database
      const count = await Notification.countUnread(userId);

      // Cache for 5 minutes
      await this.setCache(cacheKey, count.toString(), 300);

      return { count, source: 'database' };

    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      // Fallback to database
      const count = await Notification.countUnread(userId);
      return { count, source: 'fallback' };
    }
  }

  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Boolean>} Success status
   */
  async delete(notificationId, userId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        userId
      });

      if (result.deletedCount > 0) {
        await this.invalidateUnreadCache(userId);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAll(userId) {
    try {
      const result = await Notification.deleteMany({ userId });
      
      await this.invalidateUnreadCache(userId);

      return {
        deletedCount: result.deletedCount,
        message: 'All notifications deleted'
      };

    } catch (error) {
      console.error('❌ Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification from event (Kafka event handler)
   * @param {Object} event - Event data
   */
  async createFromEvent(event) {
    try {
      const {
        userId,
        type,
        title,
        body,
        data = {},
        metadata = {}
      } = event;

      return await this.create({
        userId,
        type,
        title,
        body,
        data,
        metadata
      });

    } catch (error) {
      console.error('❌ Error creating notification from event:', error);
      throw error;
    }
  }

  /**
   * Send push notification (mock implementation)
   * @param {Object} notification - Notification object
   * @param {Object} preferences - User preferences
   */
  async sendPushNotification(notification, preferences) {
    try {
      if (!notification.channels.includes('push')) {
        return;
      }

      const pushEnabled = preferences.channels?.push?.enabled;
      const pushToken = preferences.channels?.push?.token;

      if (!pushEnabled || !pushToken) {
        console.log(`📱 Push notification skipped for user ${notification.userId}: token not available`);
        return;
      }

      // Mock push notification
      console.log(`📱 [MOCK PUSH] Sending push notification to user ${notification.userId}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Body: ${notification.body}`);
      
      // In production, integrate with FCM, APNs, etc.
      // await this.sendFCM(pushToken, notification);

      // Mark as sent
      notification.isSent = true;
      notification.sentAt = new Date();
      await notification.save();

    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  /**
   * Get notification type key for preferences
   * @param {String} type - Notification type
   * @returns {String} Preferences key
   */
  getNotificationTypeKey(type) {
    const typeMap = {
      'ride_update': 'rideUpdates',
      'payment': 'paymentUpdates',
      'promotion': 'promotions',
      'system': 'systemAlerts',
      'security': 'securityAlerts'
    };
    return typeMap[type] || type;
  }

  /**
   * Get Redis client (lazy initialization)
   */
  getRedisClient() {
    if (!this._redisClient) {
      const Redis = require('ioredis');
      this._redisClient = new Redis(config.redis.url, {
        keyPrefix: config.redis.keyPrefix
      });
    }
    return this._redisClient;
  }

  /**
   * Get value from cache
   */
  async getFromCache(key) {
    try {
      const redis = this.getRedisClient();
      return await redis.get(key);
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async setCache(key, value, ttl) {
    try {
      const redis = this.getRedisClient();
      await redis.setex(key, ttl, value);
    } catch (error) {
      console.warn('Cache set error:', error.message);
    }
  }

  /**
   * Invalidate unread count cache
   */
  async invalidateUnreadCache(userId) {
    try {
      const redis = this.getRedisClient();
      const cacheKey = `${config.redis.keyPrefix}unread:${userId}`;
      await redis.del(cacheKey);
    } catch (error) {
      console.warn('Cache invalidate error:', error.message);
    }
  }
}

module.exports = new NotificationService();

