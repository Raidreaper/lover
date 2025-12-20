// Environment variable validator
const validateEnvironment = () => {
  const required = [
    'GEMINI_API_KEY',
    'JWT_SECRET'
  ];
  
  const optional = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
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
      const hiddenKeys = ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
      console.log(`  ${key}: ${hiddenKeys.includes(key) ? '***hidden***' : process.env[key]}`);
    }
  });
};

export default validateEnvironment;
