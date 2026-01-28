const preferencesService = require('../services/preferences.service');

/**
 * Preferences Controller
 * Handles notification preferences endpoints
 */
class PreferencesController {
  /**
   * GET /api/v1/notifications/preferences
   * Get user notification preferences
   */
  async get(req, res, next) {
    try {
      const userId = req.user.id;

      const preferences = await preferencesService.get(userId);

      res.json({
        success: true,
        data: { preferences },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/preferences
   * Update user notification preferences
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const preferences = await preferencesService.update(userId, updates);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/preferences/push-token
   * Update push notification token
   */
  async updatePushToken(req, res, next) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Push token is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const preferences = await preferencesService.updatePushToken(userId, token);

      res.json({
        success: true,
        message: 'Push token updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/phone
   * Update phone number for SMS notifications
   */
  async updatePhone(req, res, next) {
    try {
      const userId = req.user.id;
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const preferences = await preferencesService.updatePhone(userId, phone);

      res.json({
        success: true,
        message: 'Phone number updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/email
   * Update email for email notifications
   */
  async updateEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email address is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const preferences = await preferencesService.updateEmail(userId, email);

      res.json({
        success: true,
        message: 'Email updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/preferences
   * Reset preferences to defaults
   */
  async reset(req, res, next) {
    try {
      const userId = req.user.id;

      const preferences = await preferencesService.reset(userId);

      res.json({
        success: true,
        message: 'Preferences reset to defaults',
        data: { preferences },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PreferencesController();

