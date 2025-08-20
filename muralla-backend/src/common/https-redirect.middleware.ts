import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only redirect in production
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Allow health and metrics endpoints over HTTP (platform healthchecks)
    if (req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
      return next();
    }

    // Check if request is not secure (not HTTPS)
    // Most reverse proxies (Render, Nginx, etc.) set x-forwarded-proto / x-forwarded-ssl
    const isSecure = req.secure || 
                    req.headers['x-forwarded-proto'] === 'https' ||
                    req.headers['x-forwarded-ssl'] === 'on';

    if (!isSecure) {
      // Redirect to HTTPS
      const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
      return res.redirect(301, httpsUrl);
    }

    next();
  }
}
