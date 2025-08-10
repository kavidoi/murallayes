import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Trust Railway's proxy for proper HTTPS handling
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  
  // Enhanced security headers with SSL/TLS optimizations
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", 'https://sdk.mercadopago.com'],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        mediaSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        baseSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.mercadopago.com', 'https://www.mercadopago.cl'],
      },
    },
    crossOriginEmbedderPolicy: false,
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Content type sniffing prevention
    noSniff: true,
    // XSS protection
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));
  
  const isProd = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL;
  
  // In production, only allow HTTPS origins
  const allowedOrigins = [
    ...(frontendUrl ? [frontendUrl] : []),
    // Development origins (only in non-production)
    ...(isProd ? [] : ['http://localhost:5173', 'http://localhost:3000']),
    // Production HTTPS origins
    process.env.ADMIN_APP_URL || 'https://admin.murallayes.com',
    // Railway automatic domains (HTTPS only)
    ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      // In production, enforce HTTPS for all origins
      if (isProd && origin && !origin.startsWith('https://')) {
        console.warn(`[CORS] Blocked non-HTTPS origin in production: ${origin}`);
        return callback(new Error('HTTPS required in production'), false);
      }
      
      // In development, allow localhost with warning
      if (!isProd && origin && origin.startsWith('http://localhost')) {
        console.warn(`[CORS] Allowing localhost origin in development: ${origin}`);
        return callback(null, true);
      }
      
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    // Expose custom headers if needed
    exposedHeaders: ['X-Total-Count'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  const protocol = isProd ? 'https' : 'http';
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${port}`;
  console.log(`🚀 Muralla backend running on ${protocol}://${domain}`);
  console.log(`🔒 SSL/TLS: ${isProd ? 'Enabled (Railway managed)' : 'Development mode'}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
