/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@repo/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@repo/database$': '<rootDir>/../../packages/database/src/index.ts',
  },
};
