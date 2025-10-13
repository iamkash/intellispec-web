const request = require('supertest');

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

jest.mock('../core/RouteLoader', () => ({
  autoRegisterRoutes: jest.fn(async () => ({
    success: 0,
    skipped: 0,
    failed: 0,
  })),
}));

jest.mock('../core/FileStorage', () => ({
  init: jest.fn(),
}));

const mockPasswordResetService = {
  requestPasswordReset: jest.fn(),
  validateResetToken: jest.fn(),
  resetPassword: jest.fn(),
};

jest.mock('../services/AuthPasswordResetService', () => mockPasswordResetService);

jest.mock('../core/Metrics', () => {
  const metricsStub = {
    createCounter: jest.fn().mockImplementation(() => ({ inc: jest.fn() })),
    createGauge: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
    createHistogram: jest.fn().mockImplementation(() => ({ observe: jest.fn() })),
    shutdown: jest.fn(),
    recordHttpRequest: jest.fn(),
    httpRequestDuration: { observe: jest.fn() },
    httpRequestTotal: { inc: jest.fn() },
    httpErrorsTotal: { inc: jest.fn() },
  };
  return {
    Metrics: class {
      static registerMiddleware(fastify) {
        fastify.decorate('metrics', metricsStub);
      }
    },
    HealthCheck: {
      registerMiddleware: jest.fn(),
      registerEndpoints: jest.fn(),
      register: jest.fn(),
    },
    metrics: metricsStub,
  };
});

describe('Auth password reset routes', () => {
  let app;
  const { NotFoundError, ValidationError } = require('../core/ErrorHandler');
  const AuthPasswordResetService = require('../services/AuthPasswordResetService');
  const initialSigintListeners = process.listeners('SIGINT');
  const initialSigtermListeners = process.listeners('SIGTERM');

  beforeAll(async () => {
    process.env.APP_BASE_URL = 'http://localhost:4001';
    process.env.FRONTEND_PORT = '4001';
    process.env.EMAIL_TRANSPORT = 'console';
    process.env.ENFORCE_AUTH = 'false';
    process.env.JWT_SECRET = 'test-secret';

    const { buildServer } = require('../server');
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      if (app.rateLimiter?.storage?.shutdown) {
        app.rateLimiter.storage.shutdown();
      }
      if (app.metrics?.shutdown) {
        app.metrics.shutdown();
      }
      await app.close();
    }
    const newSigintListeners = process.listeners('SIGINT');
    const newSigtermListeners = process.listeners('SIGTERM');
    newSigintListeners
      .filter((listener) => !initialSigintListeners.includes(listener))
      .forEach((listener) => process.removeListener('SIGINT', listener));
    newSigtermListeners
      .filter((listener) => !initialSigtermListeners.includes(listener))
      .forEach((listener) => process.removeListener('SIGTERM', listener));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles forgot password request with neutral success response', async () => {
    AuthPasswordResetService.requestPasswordReset.mockResolvedValue({
      delivered: true,
    });

    const response = await request(app.server)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message:
        'If an account exists for that email, we sent password reset instructions.',
    });
    expect(AuthPasswordResetService.requestPasswordReset).toHaveBeenCalledTimes(
      1
    );
    expect(AuthPasswordResetService.requestPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        tenantSlug: undefined,
        requestContext: expect.objectContaining({
          method: 'POST',
          url: '/api/auth/forgot-password',
        }),
      })
    );
  });

  it('translates validation errors for password reset request', async () => {
    AuthPasswordResetService.requestPasswordReset.mockRejectedValue(
      new ValidationError('Email is required')
    );

    const response = await request(app.server)
      .post('/api/auth/forgot-password')
      .send({ email: '' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Email is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns masked email when validating reset token', async () => {
    AuthPasswordResetService.validateResetToken.mockResolvedValue({
      email: 'user@example.com',
      tenantSlug: 'tenant-123',
      expiresAt: new Date().toISOString(),
    });

    const response = await request(app.server).get(
      '/api/auth/reset-password/test-token'
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      maskedEmail: 'u***@example.com',
      tenantSlug: 'tenant-123',
      expiresAt: expect.any(String),
    });
    expect(AuthPasswordResetService.validateResetToken).toHaveBeenCalledWith(
      'test-token'
    );
  });

  it('neutralizes token lookup failures', async () => {
    AuthPasswordResetService.validateResetToken.mockRejectedValue(
      new NotFoundError('Password reset token')
    );

    const response = await request(app.server).get(
      '/api/auth/reset-password/expired-token'
    );

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid or expired password reset token',
      code: 'NOT_FOUND',
    });
  });

  it('resets password with valid token payload', async () => {
    AuthPasswordResetService.resetPassword.mockResolvedValue({ success: true });

    const response = await request(app.server)
      .post('/api/auth/reset-password')
      .send({
        token: 'valid-token',
        password: 'NewPassword123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message:
        'Password reset successful. You can now sign in with your new password.',
    });
    expect(AuthPasswordResetService.resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'valid-token',
        newPassword: 'NewPassword123!',
        requestContext: expect.objectContaining({
          method: 'POST',
          url: '/api/auth/reset-password',
        }),
      })
    );
  });

  it('handles invalid reset tokens during password update', async () => {
    AuthPasswordResetService.resetPassword.mockRejectedValue(
      new NotFoundError('Password reset token')
    );

    const response = await request(app.server)
      .post('/api/auth/reset-password')
      .send({
        token: 'bad-token',
        password: 'AnotherValid123',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid or expired password reset token',
      code: 'NOT_FOUND',
    });
  });
});
