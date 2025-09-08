// Environment variable validator
const validateEnvironment = () => {
  const required = [
    'GEMINI_API_KEY',
    'JWT_SECRET'
  ];
  
  const optional = [
    'MONGODB_URI',
    'PORT',
    'NODE_ENV',
    'CORS_ORIGIN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  
  // Log optional variables if present
  optional.forEach(key => {
    if (process.env[key]) {
      console.log(`  ${key}: ${key === 'MONGODB_URI' ? '***hidden***' : process.env[key]}`);
    }
  });
};

export default validateEnvironment;
