module.exports = {
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/api/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/api/test/setup.js'],
  clearMocks: true,
  restoreMocks: true
};
