/**
 * Environment configuration with validation
 * 
 * Configured for Supabase backend
 */

import 'dotenv/config';

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'VITE_APP_ID',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
] as const;

/**
 * Optional environment variables with their defaults
 */
const OPTIONAL_ENV_VARS = {
  PORT: '3000',
  NODE_ENV: 'development',
} as const;

/**
 * Validate that a required environment variable is set and non-empty
 */
function requireEnvVar(name: string): string {
  const value = process.env[name];
  
  if (!value || value.trim() === '') {
    throw new Error(
      `FATAL: Required environment variable '${name}' is not set. ` +
      `Please set it in your .env file or environment configuration.`
    );
  }
  
  return value.trim();
}

/**
 * Get optional environment variable with default
 */
function getEnvVar(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Validate JWT secret meets minimum security requirements
 */
function validateJwtSecret(secret: string): void {
  const MIN_SECRET_LENGTH = 32;
  
  if (secret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `⚠️  WARNING: JWT_SECRET should be at least ${MIN_SECRET_LENGTH} characters long. ` +
      `Current length: ${secret.length}. ` +
      `Generate a strong secret with: openssl rand -base64 32`
    );
  }
  
  // Warn if secret looks like a placeholder
  const PLACEHOLDER_PATTERNS = [
    /^your[-_]?secret/i,
    /^change[-_]?me/i,
    /^secret$/i,
    /^password$/i,
    /^123/,
  ];
  
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(secret)) {
      console.warn(
        `⚠️  WARNING: JWT_SECRET appears to be a placeholder value. ` +
        `Please use a cryptographically secure random string in production.`
      );
      break;
    }
  }
}

/**
 * Validate database URL format (PostgreSQL for Supabase)
 */
function validateDatabaseUrl(url: string): void {
  if (!url) {
    console.warn('⚠️  WARNING: DATABASE_URL is not set. Database features will be unavailable.');
    return;
  }
  
  try {
    const parsed = new URL(url);
    
    if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
      console.warn(
        `⚠️  WARNING: Database URL protocol '${parsed.protocol}' may not be supported. ` +
        `Expected postgresql: or postgres: for Supabase`
      );
    }
    
    if (!parsed.hostname) {
      throw new Error('Database URL must include a hostname');
    }
  } catch (error) {
    if (url) {
      console.warn(
        `⚠️  WARNING: DATABASE_URL format issue. ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Initialize and validate environment configuration
 */
function initializeEnv() {
  console.log('🔍 Validating environment configuration...');
  
  try {
    // Validate required environment variables
    const appId = requireEnvVar('VITE_APP_ID');
    const supabaseUrl = requireEnvVar('SUPABASE_URL');
    const supabaseAnonKey = requireEnvVar('SUPABASE_ANON_KEY');
    
    // Optional but recommended
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const databaseUrl = process.env.DATABASE_URL || '';
    const jwtSecret = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
    
    // Validate JWT secret if provided
    if (jwtSecret) {
      validateJwtSecret(jwtSecret);
    }
    
    // Validate database URL if provided
    if (databaseUrl) {
      validateDatabaseUrl(databaseUrl);
    }
    
    // Get optional variables
    const port = getEnvVar('PORT', OPTIONAL_ENV_VARS.PORT);
    const nodeEnv = getEnvVar('NODE_ENV', OPTIONAL_ENV_VARS.NODE_ENV);
    
    // Optional variables that may not be set
    const ownerOpenId = process.env.OWNER_OPEN_ID || '';
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL || '';
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY || '';
    
    // Warn if Forge API is partially configured
    if ((forgeApiUrl && !forgeApiKey) || (!forgeApiUrl && forgeApiKey)) {
      console.warn(
        '⚠️  WARNING: Forge API is partially configured. ' +
        'Both BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY must be set.'
      );
    }
    
    const isProduction = nodeEnv === 'production';
    
    // Production-specific warnings
    if (isProduction) {
      if (!supabaseServiceRoleKey) {
        console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set in production');
      }
      
      if (!databaseUrl) {
        console.warn('⚠️  WARNING: DATABASE_URL not set in production');
      }
    }
    
    console.log('✅ Environment configuration validated successfully');
    console.log(`   Supabase URL: ${supabaseUrl}`);
    console.log(`   Database: ${databaseUrl ? 'Configured' : 'Not configured'}`);
    
    return {
      appId,
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey,
      databaseUrl,
      cookieSecret: jwtSecret,
      ownerOpenId,
      forgeApiUrl,
      forgeApiKey,
      port: parseInt(port, 10),
      isProduction,
      isDevelopment: nodeEnv === 'development',
      nodeEnv,
      // Legacy compatibility
      oAuthServerUrl: '', // No longer needed with Supabase Auth
    };
  } catch (error) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERROR\n');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nThe application cannot start with missing or invalid environment variables.');
    console.error('Please check your .env file or environment configuration.\n');
    
    // Exit the process - don't allow the app to start with invalid config
    process.exit(1);
  }
}

// Initialize and export validated environment
export const ENV = initializeEnv();

/**
 * Helper function to check if a feature flag is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
  const envVar = `FEATURE_${featureName.toUpperCase()}`;
  const value = process.env[envVar];
  return value === 'true' || value === '1';
}
