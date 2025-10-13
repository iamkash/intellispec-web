module.exports = {
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/api/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/api/test/setup.js'],
  globalTeardown: '<rootDir>/api/test/globalTeardown.js',
  clearMocks: true,
  restoreMocks: true
};
