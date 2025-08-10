# SSL/TLS Implementation Guide for Muralla 4.0

This guide covers the complete SSL/TLS setup for your Muralla application deployed on Railway.

## 🔒 Overview

Railway provides automatic SSL/TLS termination with Let's Encrypt certificates, but your application needs proper configuration to work securely with it.

## ✅ What's Already Implemented

### Backend (NestJS)
- ✅ Trust proxy configuration for Railway
- ✅ Enhanced security headers with Helmet
- ✅ HTTPS redirect middleware
- ✅ CORS configuration with HTTPS enforcement
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ Content Security Policy (CSP) with HTTPS-only directives

### Frontend (React/Vite)
- ✅ HTTPS utility functions
- ✅ Automatic HTTPS enforcement in production
- ✅ HTTPS-aware API communication
- ✅ Secure service workers and resources

## 🚀 Railway SSL/TLS Features

Railway automatically provides:
- **Let's Encrypt SSL certificates** (RSA 2048-bit)
- **Automatic certificate renewal** (every 60 days)
- **TLS 1.2+ enforcement**
- **HTTP to HTTPS redirects** (301 redirects for GET, POST becomes GET)
- **SNI (Server Name Indication) support**

## 🛠️ Configuration Details

### 1. Backend Security Configuration

#### Trust Proxy Settings
```typescript
// src/main.ts
const expressApp = app.getHttpAdapter().getInstance();
expressApp.set('trust proxy', 1); // Trust Railway's proxy
```

#### Enhanced Security Headers
```typescript
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https:'],
      // ... other secure directives
    },
  },
}));
```

#### HTTPS Redirect Middleware
```typescript
// src/common/https-redirect.middleware.ts
// Automatically redirects HTTP to HTTPS in production
// Respects Railway's x-forwarded-proto header
```

### 2. Frontend HTTPS Configuration

#### HTTPS Utilities
```typescript
// src/utils/https.ts
export class HttpsUtils {
  static ensureHttps(url: string): string
  static getApiBaseUrl(): string
  static enforceHttps(): void
}
```

#### Automatic HTTPS Enforcement
- Production builds automatically redirect to HTTPS
- API calls use HTTPS-aware base URLs
- Development allows localhost HTTP

## 🌐 Setting Up Custom Domains

### Step 1: Add Domain in Railway Dashboard

1. Go to your Railway project
2. Select your service (Backend or Frontend)
3. Navigate to **Settings** → **Domains**
4. Click **Add Custom Domain**
5. Enter your domain (e.g., `api.yourdomain.com`)

### Step 2: Configure DNS Records

Railway will provide you with CNAME values. Set up your DNS:

```dns
# For backend API
api.yourdomain.com.     CNAME   YOUR-BACKEND-RAILWAY-DOMAIN.up.railway.app.

# For frontend
app.yourdomain.com.     CNAME   YOUR-FRONTEND-RAILWAY-DOMAIN.up.railway.app.

# For SSL validation (if using wildcard)
_acme-challenge.api.yourdomain.com.  CNAME   YOUR-ACME-CHALLENGE-DOMAIN
```

### Step 3: SSL Certificate Issuance

- Railway automatically issues Let's Encrypt certificates
- Certificate issuance usually takes **5-60 minutes**
- Certificates are valid for **90 days** and auto-renew at **30 days**

### Step 4: Update Environment Variables

```bash
# Backend
FRONTEND_URL=https://app.yourdomain.com
RAILWAY_PUBLIC_DOMAIN=api.yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 🔧 Special Configurations

### Cloudflare Integration

If using Cloudflare:

1. **SSL/TLS Mode**: Set to **Full** (not Full Strict)
2. **Always Use HTTPS**: Enable this setting
3. **CNAME Records**: Set to DNS Only (grey cloud) for ACME challenges
4. **Wildcard Domains**: Requires Cloudflare Advanced Certificate Manager

### WebSocket Secure (WSS)

WebSocket connections automatically use WSS in production:

```typescript
// Automatically handled by Railway's SSL termination
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
```

## 🔍 Testing SSL/TLS Setup

### 1. Certificate Validation

```bash
# Test SSL certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Check certificate details
curl -vI https://api.yourdomain.com/health
```

### 2. Security Headers Check

```bash
# Test security headers
curl -I https://api.yourdomain.com/health

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### 3. HTTPS Redirect Test

```bash
# Should redirect to HTTPS
curl -L http://api.yourdomain.com/health
```

### 4. Online SSL Testing

- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Security Headers Test](https://securityheaders.com/)

## 📊 Monitoring & Alerts

### Certificate Expiry Monitoring

Railway handles renewal automatically, but monitor:
- Certificate expiry dates
- SSL health checks
- TLS handshake metrics

### Security Monitoring

Monitor for:
- Mixed content warnings
- SSL/TLS errors in logs
- HTTPS downgrade attempts
- Certificate transparency logs

## 🚨 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Mixed content errors | HTTP resources on HTTPS page | Update all URLs to HTTPS |
| Certificate not found | DNS not propagated | Wait for DNS propagation (up to 48h) |
| ERR_TOO_MANY_REDIRECTS | Cloudflare SSL mode incorrect | Set Cloudflare to "Full" mode |
| WebSocket connection failed | WSS not configured | Check protocol detection logic |

### Debug Commands

```bash
# Check DNS propagation
nslookup api.yourdomain.com

# Test SSL handshake
openssl s_client -connect api.yourdomain.com:443 -verify_return_error

# Check certificate chain
curl --verbose https://api.yourdomain.com/health
```

## 📋 Deployment Checklist

- [ ] **Backend Configuration**
  - [ ] Trust proxy enabled
  - [ ] Security headers configured
  - [ ] HTTPS redirect middleware active
  - [ ] CORS with HTTPS enforcement

- [ ] **Frontend Configuration**
  - [ ] HTTPS utilities implemented
  - [ ] Production HTTPS enforcement
  - [ ] API base URL uses HTTPS

- [ ] **Railway Setup**
  - [ ] Custom domains added
  - [ ] DNS records configured
  - [ ] SSL certificates issued
  - [ ] Environment variables updated

- [ ] **Testing**
  - [ ] SSL certificate valid
  - [ ] Security headers present
  - [ ] HTTPS redirects working
  - [ ] No mixed content errors

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
2. **Implement HSTS headers**
3. **Use secure cookies** (`Secure` and `SameSite` flags)
4. **Content Security Policy** with HTTPS-only sources
5. **Regular security audits**
6. **Monitor certificate expiry**
7. **Keep dependencies updated**

## 📚 Additional Resources

- [Railway SSL Documentation](https://docs.railway.app/guides/public-networking)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OWASP HTTPS Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

**✅ Your Muralla application is now configured with enterprise-grade SSL/TLS security!**
