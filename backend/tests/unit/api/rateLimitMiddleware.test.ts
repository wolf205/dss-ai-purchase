import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

describe('rateLimitMiddleware (Layer 1 Defense)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create a local limiter for testing with small max limit
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
          },
          timestamp: new Date().toISOString(),
        });
      },
    });

    app.post('/test-login', testLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });
  });

  it('should allow requests within limit and block requests exceeding limit with 429 Uniform Envelope', async () => {
    // 1st request -> OK
    const res1 = await request(app).post('/test-login');
    expect(res1.status).toBe(200);

    // 2nd request -> OK
    const res2 = await request(app).post('/test-login');
    expect(res2.status).toBe(200);

    // 3rd request -> Blocked with 429
    const res3 = await request(app).post('/test-login');
    expect(res3.status).toBe(429);
    expect(res3.body.success).toBe(false);
    expect(res3.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(res3.body.error.message).toContain('Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này');
    expect(res3.body.timestamp).toBeDefined();
  });
});
