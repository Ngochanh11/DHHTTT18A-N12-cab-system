const Preferences = require('../models/preferences.model');

class PreferencesService {
  /**
   * Get preferences for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async get(userId) {
    try {
      const preferences = await Preferences.getOrCreate(userId);
      return preferences;
    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      throw error;
    }
  }

  /**
   * Update preferences for a user
   * @param {String} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated preferences
   */
  async update(userId, updates) {
    try {
      const preferences = await Preferences.updatePreferences(userId, updates);
      return preferences;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Reset preferences to defaults for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Reset preferences
   */
  async reset(userId) {
    try {
      await Preferences.deleteOne({ userId });
      const preferences = await Preferences.getOrCreate(userId);
      return preferences;
    } catch (error) {
      console.error('❌ Error resetting preferences:', error);
      throw error;
    }
  }

  /**
   * Check if a notification type is enabled for a user
   * @param {String} userId - User ID
   * @param {String} type - Notification type
   * @param {String} channel - Notification channel (push, sms, email)
   * @returns {Promise<Boolean>} Is enabled
   */
  async isEnabled(userId, type, channel = 'push') {
    try {
      const preferences = await this.get(userId);
      const typeKey = this.getNotificationTypeKey(type);
      
      const typeConfig = preferences.notifications[typeKey];
      if (!typeConfig || !typeConfig.enabled) {
        return false;
      }

      const channelConfig = preferences.channels[channel];
      if (!channelConfig || !channelConfig.enabled) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking preferences:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} preferences - User preferences
   * @returns {Boolean} Is in quiet hours
   */
  isInQuietHours(preferences) {
    const { quietHours } = preferences;
    
    if (!quietHours || !quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { startTime, endTime } = quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Normal quiet hours (e.g., 09:00 - 17:00)
    return currentTime >= startTime && currentTime <= endTime;
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
   * Update push token for a user
   * @param {String} userId - User ID
   * @param {String} token - Push token
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePushToken(userId, token) {
    try {
      const preferences = await Preferences.findOneAndUpdate(
        { userId },
        { $set: { 'channels.push.token': token } },
        { new: true, upsert: true }
      );
      return preferences;
    } catch (error) {
      console.error('❌ Error updating push token:', error);
      throw error;
    }
  }

  /**
   * Update phone number for SMS notifications
   * @param {String} userId - User ID
   * @param {String} phone - Phone number
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePhone(userId, phone) {
    try {
      const preferences = await Preferences.findOneAndUpdate(
        { userId },
        { $set: { 'channels.sms.phone': phone, 'channels.sms.enabled': true } },
        { new: true, upsert: true }
      );
      return preferences;
    } catch (error) {
      console.error('❌ Error updating phone:', error);
      throw error;
    }
  }

  /**
   * Update email for email notifications
   * @param {String} userId - User ID
   * @param {String} email - Email address
   * @returns {Promise<Object>} Updated preferences
   */
  async updateEmail(userId, email) {
    try {
      const preferences = await Preferences.findOneAndUpdate(
        { userId },
        { $set: { 'channels.email.address': email, 'channels.email.enabled': true } },
        { new: true, upsert: true }
      );
      return preferences;
    } catch (error) {
      console.error('❌ Error updating email:', error);
      throw error;
    }
  }
}

module.exports = new PreferencesService();

