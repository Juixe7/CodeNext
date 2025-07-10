require('dotenv').config();

const requiredEnvVars = [
  'DB_CONNECT_STRING',
  'JWT_KEY',
  'PORT',
  'REDIS_PASS'
];

const optionalEnvVars = [
  'REDIS_HOST',
  'REDIS_PORT'
];

const validateEnvironment = () => {
  const missing = [];
  
  // Check required variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });
  
  // Check optional variables and warn if missing
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Optional environment variable ${envVar} not set, using default value`);
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
  console.log('🔧 Environment variables status:');
  [...requiredEnvVars, ...optionalEnvVars].forEach(envVar => {
    const status = process.env[envVar] ? '✅' : '❌';
    console.log(`   ${status} ${envVar}`);
  });
};

module.exports = validateEnvironment;
