const { v4: uuid } = require('uuid');
const Notification = require('../models/notification.model');

// In-memory storage fallback when MongoDB is not available
let memoryStore = [];

exports.createNotification = async (data) => {
  try {
    const notification = new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || {},
      channels: data.channels || ['push']
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    // Fallback to memory storage if DB fails
    console.log('Using memory storage for notifications');
    const notification = {
      id: uuid(),
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || {},
      isRead: false,
      channels: data.channels || ['push'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.push(notification);
    return notification;
  }
};

exports.getUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  
  try {
    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    // Fallback to memory storage
    console.log('Using memory storage for getUserNotifications');
    let filtered = memoryStore.filter(n => n.userId === userId);
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return {
      notifications: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit)
      }
    };
  }
};

exports.markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    // Fallback to memory storage
    console.log('Using memory storage for markAsRead');
    const notification = memoryStore.find(
      n => n.id === notificationId && n.userId === userId
    );
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date();
    }
    return notification;
  }
};

exports.markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return { success: true };
  } catch (error) {
    // Fallback to memory storage
    console.log('Using memory storage for markAllAsRead');
    memoryStore.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.updatedAt = new Date();
      }
    });
    return { success: true };
  }
};

exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { count };
  } catch (error) {
    // Fallback to memory storage
    console.log('Using memory storage for getUnreadCount');
    const count = memoryStore.filter(n => n.userId === userId && !n.isRead).length;
    return { count };
  }
};

exports.getNotificationPreferences = async (userId) => {
  // For now, return default preferences
  // In production, this would be stored in the database
  return {
    userId,
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false,
    rideUpdates: true,
    promotions: true,
    paymentUpdates: true,
    systemAlerts: true
  };
};

exports.updateNotificationPreferences = async (userId, preferences) => {
  // For now, just return the updated preferences
  // In production, this would be saved to the database
  return {
    userId,
    ...preferences
  };
};

exports.sendNotification = async (data) => {
  // Internal method to send notification through specified channels
  // In production, this would integrate with FCM, Twilio, SendGrid, etc.
  console.log(`📱 Sending ${data.channels?.join(', ') || 'push'} notification to user ${data.userId}:`);
  console.log(`   Title: ${data.title}`);
  console.log(`   Body: ${data.body}`);
  
  // Create the notification record
  return exports.createNotification(data);
};

