const Fastify = require('fastify');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

const mockFindWithPagination = jest.fn();
const mockSearch = jest.fn();

jest.mock('../repositories/DocumentRepository', () => {
  return jest.fn().mockImplementation(() => ({
    findWithPagination: mockFindWithPagination,
    search: mockSearch
  }));
});

jest.mock('../core/TenantContextFactory', () => {
  const TenantContext = require('../core/TenantContext');
  const contextInstance = new TenantContext({
    userId: 'user-123',
    tenantId: 'tenant-123',
    isPlatformAdmin: false
  });
  return {
    fromRequest: jest.fn(() => contextInstance)
  };
});

jest.mock('../core/AuthService', () => ({
  authenticateWithCredentials: jest.fn(),
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn(),
  getUserById: jest.fn()
}));

describe('API smoke tests', () => {
  let app;
  let AuthService;
  let DocumentRepository;
  let TenantContextFactory;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    AuthService = require('../core/AuthService');
    DocumentRepository = require('../repositories/DocumentRepository');
    TenantContextFactory = require('../core/TenantContextFactory');

    const registerAuthRoutes = require('../routes/auth-fastify');
    const registerDocumentRoutes = require('../routes/documents');

    app = Fastify();

    await app.register(registerAuthRoutes);
    await app.register(async (instance) => {
      await registerDocumentRoutes(instance);
    }, { prefix: '/api' });

    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    DocumentRepository.mockClear();
    mockFindWithPagination.mockReset();
    mockSearch.mockReset();
  });

  it('successfully logs in via /api/auth/login', async () => {
    AuthService.authenticateWithCredentials.mockResolvedValue({
      success: true,
      token: 'test-token',
      user: { id: 'user-123', email: 'user@example.com' }
    });

    const response = await request(app.server)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'passw0rd' });

    expect(response.status).toBe(200);
    expect(AuthService.authenticateWithCredentials).toHaveBeenCalledWith(
      'user@example.com',
      'passw0rd',
      undefined
    );
    expect(response.body).toMatchObject({
      success: true,
      token: 'test-token',
      user: expect.objectContaining({ email: 'user@example.com' })
    });
  });

  it('rejects unauthenticated access to /api/documents', async () => {
    const response = await request(app.server)
      .get('/api/documents')
      .query({ type: 'company' });

    expect(response.status).toBe(401);
    expect(mockFindWithPagination).not.toHaveBeenCalled();
  });

  it('allows authenticated access to /api/documents', async () => {
    const token = jwt.sign(
      { userId: 'user-123', tenantId: 'tenant-123', roles: [] },
      process.env.JWT_SECRET
    );

    mockFindWithPagination.mockResolvedValue({
      data: [{ id: 'doc-1', name: 'Sample Document' }],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1
    });

    const response = await request(app.server)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .query({ type: 'company' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [{ id: 'doc-1', name: 'Sample Document' }]
    });
    expect(mockFindWithPagination).toHaveBeenCalledTimes(1);
    expect(TenantContextFactory.fromRequest).toHaveBeenCalledTimes(1);
  });
});
