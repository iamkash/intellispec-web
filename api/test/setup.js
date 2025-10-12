process.env.ENABLE_VECTOR_SERVICE = 'false';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.setTimeout(30000);
