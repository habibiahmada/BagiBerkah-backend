import { z } from 'zod';
import logger from './logger';

const envSchema = z.object({
  // Server
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT (optional for now since no auth)
  JWT_SECRET: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // Mayar Payment Gateway
  MAYAR_API_KEY: z.string().optional(),
  MAYAR_WEBHOOK_SECRET: z.string().optional(),
  MAYAR_BASE_URL: z.string().default('https://api.mayar.id'),
  
  // URLs
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  APP_URL: z.string().default('http://localhost:5000'),
  
  // App
  APP_NAME: z.string().default('BagiBerkah'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Warnings for optional but recommended variables
    if (!env.OPENAI_API_KEY) {
      logger.warn('⚠️  OPENAI_API_KEY not set - AI features will use fallback mode');
    }
    
    if (!env.MAYAR_API_KEY) {
      logger.warn('⚠️  MAYAR_API_KEY not set - Payment will use mock mode');
    }
    
    if (!env.MAYAR_WEBHOOK_SECRET) {
      logger.warn('⚠️  MAYAR_WEBHOOK_SECRET not set - Webhook verification disabled');
    }
    
    logger.info('✅ Environment variables validated successfully');
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Validate on import
export const env = validateEnv();
