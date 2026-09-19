const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/__tests__/**/*.test.js'],
    setupFiles: ['server/__tests__/setup.js'],
    // sql.js writes a whole file per op; run files sequentially to avoid DB races
    fileParallelism: false,
  },
});
