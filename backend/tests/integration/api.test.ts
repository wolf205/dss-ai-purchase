import request from 'supertest';
import { app } from '../../src/api/app';

describe('Express API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return 200 OK with service info', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe('dss-backend');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /non-existent-route', () => {
    it('should return 404 NOT_FOUND for undefined routes', async () => {
      const res = await request(app).get('/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 VALIDATION_ERROR when username or password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/products', () => {
    it('should return 401 UNAUTHORIZED when no Bearer token is provided', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT & PATCH /api/v1/suppliers/:id', () => {
    it('should return 401 UNAUTHORIZED when calling PUT without Bearer token', async () => {
      const res = await request(app).put('/api/v1/suppliers/1').send({ name: 'Vinamilk' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 UNAUTHORIZED when calling PATCH without Bearer token', async () => {
      const res = await request(app).patch('/api/v1/suppliers/1').send({ name: 'Vinamilk' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/suppliers/:id/products', () => {
    it('should return 401 UNAUTHORIZED when calling POST without Bearer token', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers/1/products')
        .send({ productSku: 'MILK-VNM-180', purchasePrice: 6200 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/suppliers/:id/deliveries', () => {
    it('should return 401 UNAUTHORIZED when calling GET without Bearer token', async () => {
      const res = await request(app).get('/api/v1/suppliers/1/deliveries');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

