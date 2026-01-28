const mongoose = require('mongoose');
const config = require('../config');

const preferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Channel preferences
  channels: {
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      token: {
        type: String,
        default: null
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: true
      },
      phone: {
        type: String,
        default: null
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      address: {
        type: String,
        default: null
      }
    }
  },
  
  // Notification type preferences
  notifications: {
    rideUpdates: {
      type: Object,
      default: {
        enabled: true,
        push: true,
        sms: false,
        email: false
      }
    },
    paymentUpdates: {
      type: Object,
      default: {
        enabled: true,
        push: true,
        sms: true,
        email: true
      }
    },
    promotions: {
      type: Object,
      default: {
        enabled: false,
        push: false,
        sms: false,
        email: true
      }
    },
    systemAlerts: {
      type: Object,
      default: {
        enabled: true,
        push: true,
        sms: false,
        email: true
      }
    },
    securityAlerts: {
      type: Object,
      default: {
        enabled: true,
        push: true,
        sms: true,
        email: true
      }
    }
  },
  
  // Quiet hours
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00'
    },
    endTime: {
      type: String,
      default: '07:00'
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    }
  },
  
  // Language preference
  language: {
    type: String,
    default: 'vi',
    enum: ['vi', 'en']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Static method to get or create preferences
preferencesSchema.statics.getOrCreate = async function(userId) {
  let prefs = await this.findOne({ userId });
  if (!prefs) {
    prefs = await this.create({ userId });
  }
  return prefs;
};

// Static method to update preferences
preferencesSchema.statics.updatePreferences = async function(userId, updates) {
  const allowedUpdates = {};
  
  // Channel updates
  if (updates.channels) {
    if (updates.channels.push !== undefined) {
      allowedUpdates['channels.push.enabled'] = updates.channels.push.enabled;
      if (updates.channels.push.token !== undefined) {
        allowedUpdates['channels.push.token'] = updates.channels.push.token;
      }
    }
    if (updates.channels.sms !== undefined) {
      allowedUpdates['channels.sms.enabled'] = updates.channels.sms.enabled;
      if (updates.channels.sms.phone !== undefined) {
        allowedUpdates['channels.sms.phone'] = updates.channels.sms.phone;
      }
    }
    if (updates.channels.email !== undefined) {
      allowedUpdates['channels.email.enabled'] = updates.channels.email.enabled;
      if (updates.channels.email.address !== undefined) {
        allowedUpdates['channels.email.address'] = updates.channels.email.address;
      }
    }
  }
  
  // Notification type updates
  if (updates.notifications) {
    Object.keys(updates.notifications).forEach(key => {
      if (config.notificationTypes.some(type => 
        key.toLowerCase().includes(type.replace('_', '')) || 
        key === 'paymentUpdates' || 
        key === 'systemAlerts' || 
        key === 'securityAlerts'
      )) {
        allowedUpdates[`notifications.${key}`] = updates.notifications[key];
      }
    });
  }
  
  // Quiet hours updates
  if (updates.quietHours) {
    if (updates.quietHours.enabled !== undefined) {
      allowedUpdates['quietHours.enabled'] = updates.quietHours.enabled;
    }
    if (updates.quietHours.startTime !== undefined) {
      allowedUpdates['quietHours.startTime'] = updates.quietHours.startTime;
    }
    if (updates.quietHours.endTime !== undefined) {
      allowedUpdates['quietHours.endTime'] = updates.quietHours.endTime;
    }
    if (updates.quietHours.timezone !== undefined) {
      allowedUpdates['quietHours.timezone'] = updates.quietHours.timezone;
    }
  }
  
  // Language updates
  if (updates.language) {
    allowedUpdates.language = updates.language;
  }
  
  return this.findOneAndUpdate(
    { userId },
    { $set: allowedUpdates },
    { new: true, upsert: true }
  );
};

const Preferences = mongoose.model('Preferences', preferencesSchema);

module.exports = Preferences;

