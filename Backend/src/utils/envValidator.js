require('dotenv').config();

const requiredEnvVars = [
  'DB_CONNECT_STRING',
  'JWT_KEY',
  'PORT',
  'REDIS_PASS',
  'REDIS_HOST',
  'REDIS_PORT'
];

const validateEnvironment = () => {
  const missing = [];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease set these environment variables in your deployment platform (Render).');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
};

module.exports = validateEnvironment;
