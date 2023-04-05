export default {
  clearMocks: true,
  coverageProvider: 'v8',
  preset: 'ts-jest/presets/js-with-ts',
  setupFiles: [],
  transform: {
    '^.+\\.mjs$': 'ts-jest',
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
}
