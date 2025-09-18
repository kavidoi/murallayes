# Changelog

All notable changes to the Muralla 4.0 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.1] - 2024-09-18

### Added
- **MercadoPago Status Endpoint**: New `/mercadopago/status` endpoint to check SDK configuration
- **Enhanced Environment Variable Support**: Added support for `MP_PUBLIC_KEY` environment variable
- **Comprehensive Documentation**: Created detailed `DEVELOPMENT.md` guide
- **AI Assistant Guide**: Created `AI_ASSISTANT_GUIDE.md` for consistent AI support
- **Backward Compatibility**: Added fallback support for `MERCADOPAGO_ACCESS_TOKEN` variable

### Fixed
- **POS Transaction Processing**: Resolved "20 transactions processed 0 created" issue
  - Enhanced ID generation logic in `pos-sync.service.ts`
  - Added comprehensive fallback strategies for missing/undefined transaction IDs
  - Added test script `test-pos-fix.js` to verify fix functionality
- **MercadoPago Configuration**: Fixed "MercadoPago public key not configured" frontend error
  - Added public key validation in MercadoPago service
  - Enhanced service initialization to handle both access token and public key
  - Added proper status reporting for frontend integration

### Changed
- **MercadoPago Service**: Enhanced `onModuleInit()` to support multiple environment variable formats
- **Environment Variables**: Updated naming convention to use `MP_` prefix for all MercadoPago variables
- **Documentation**: Updated README.md with branch strategy and current URLs
- **Error Handling**: Improved error messages and status reporting across POS and payment services

### Technical Details

#### POS Transaction Fix
- **Location**: `src/pos/pos-sync.service.ts`
- **Problem**: Tuu API was returning transactions with `undefined`, `null`, or empty string IDs
- **Solution**: Implemented fallback ID generation using:
  - Primary: `sale.id`, `sale.transactionId`, `sale.saleId`, `sale.tuuSaleId`
  - Fallback: Generated from `${serialNumber}-${timestamp}-${amount}-${sequence}`
- **Validation**: Added strict ID validation before database operations
- **Testing**: Created comprehensive test script to verify fix

#### MercadoPago Status Endpoint
- **Endpoint**: `GET /mercadopago/status`
- **Purpose**: Allow frontend to check MercadoPago SDK configuration status
- **Response Format**:
  ```json
  {
    "configured": boolean,
    "hasAccessToken": boolean,
    "hasPublicKey": boolean,
    "publicKey": string (when available),
    "message": string
  }
  ```
- **Security**: Public endpoint (no authentication required)
- **Integration**: Frontend can now display accurate configuration status

#### Environment Variable Enhancement
- **Primary Format**: `MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`
- **Fallback Support**: `MERCADOPAGO_ACCESS_TOKEN` (for backward compatibility)
- **Currency Support**: `MP_CURRENCY` (defaults to CLP)
- **Validation**: Enhanced service initialization with proper error handling

### Developer Experience
- **Documentation**: Complete development guide with troubleshooting
- **Branch Strategy**: Clearly documented `main` vs `frontend-deploy` usage
- **Environment Setup**: Step-by-step local development instructions
- **Testing Commands**: Documented all health check and testing endpoints
- **AI Support**: Created persistent guide for AI assistants working on the project

### Infrastructure
- **Health Checks**: Enhanced monitoring endpoints
- **Error Reporting**: Improved error messages and logging
- **Database Operations**: Added safer transaction handling
- **Service Resilience**: Better handling of external API failures

## [4.0.0] - 2024-09-XX

### Added
- Initial Muralla 4.0 release
- NestJS backend with TypeScript
- React frontend with Vite
- PostgreSQL database with Prisma ORM
- MercadoPago payment integration
- POS system integration with Tuu API
- Authentication and authorization system
- Project and task management features
- Inventory management
- Financial tracking and reporting

### Infrastructure
- Render.com deployment setup
- Automated CI/CD from Git branches
- PostgreSQL and Redis hosting
- Environment variable management
- Health check endpoints

---

## Version Notes

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (4.X.0)**: New features, significant improvements
- **Patch (4.0.X)**: Bug fixes, small improvements, documentation updates

### Branch Strategy
- **main**: Backend development, deploys to production backend
- **frontend-deploy**: Frontend development, deploys to production frontend
- **feature/***: Feature development branches (merge to appropriate main branch)

### Deployment
- Backend deploys automatically from `main` branch to https://api.murallacafe.cl
- Frontend deploys automatically from `frontend-deploy` branch to https://admin.murallacafe.cl
- Database migrations run automatically on backend deployment

---

*For detailed development instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md)*
*For AI assistant context, see [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md)*