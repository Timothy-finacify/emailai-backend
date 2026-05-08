const app = require('./src/app');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Server running on port ' + PORT);
  console.log('📝 Environment: ' + NODE_ENV);
  console.log('🔗 Frontend URL: ' + FRONTEND_URL);
  console.log('='.repeat(60) + '\n');
});

// ✅ Disable logs AFTER startup messages
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
}

process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;