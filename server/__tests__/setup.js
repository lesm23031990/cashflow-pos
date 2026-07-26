const path = require('path');

process.env.JWT_SECRET = 'test-secret';
process.env.DB_PATH = path.join(__dirname, '..', '..', 'data', 'test.db');
