/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@repo/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@repo/database$': '<rootDir>/../../packages/database/src/index.ts',
  },
};
