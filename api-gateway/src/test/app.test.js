const request = require('supertest');
const { app } = require('../app');

describe('API Gateway', () => {
  describe('Health Check', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('api-gateway');
    });

    it('should return 200 for legacy health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to requests', async () => {
      // Make multiple requests quickly
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/v1/health');
      }
      
      // The 11th request might be rate limited (depends on config)
      const response = await request(app)
        .get('/api/v1/health')
        .expect(429); // Too Many Requests
      
      expect(response.body.error).toBe('Too many requests');
    });
  });
});