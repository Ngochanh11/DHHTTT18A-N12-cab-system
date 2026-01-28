const request = require('supertest');
const { app } = require('./src/app');
const dbConnection = require('./src/database/connection');

// Mock database connection
jest.mock('./src/database/connection', () => ({
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', latency: '1ms' })
}));

// Mock Kafka service
jest.mock('./src/services/kafka.service', () => ({
  initConsumer: jest.fn().mockResolvedValue({}),
  initProducer: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({})
}));

describe('Notification Service', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('notification-service');
    });
  });

  describe('Root Endpoint', () => {
    it('should return service info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Notification Service');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/notifications/unread/count', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/unread/count')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/preferences', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/preferences')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Input Validation', () => {
  it('should reject invalid pagination parameters', async () => {
    const response = await request(app)
      .get('/api/v1/notifications?page=-1')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject limit exceeding max', async () => {
    const response = await request(app)
      .get('/api/v1/notifications?limit=1000')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

