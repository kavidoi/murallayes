# Muralla Backend API

NestJS-based backend API for Muralla Cafe management system.

## Features

- 🧾 **Invoicing System** with OpenFactura integration
- 💳 **MercadoPago** payment processing
- 🏪 **POS Integration** with TUU synchronization
- 🔐 **JWT Authentication**
- 📊 **Prisma ORM** with PostgreSQL

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Payment**: MercadoPago SDK
- **Invoicing**: OpenFactura API
- **Runtime**: Node.js 20.19.0

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/muralla_db"

# JWT
JWT_SECRET="your-secret-key"

# OpenFactura
OPENFACTURA_BASE_URL="https://api.haulmer.com"
OPENFACTURA_API_KEY="your-api-key"
COMPANY_RUT="78188363-8"

# MercadoPago
MP_PUBLIC_KEY="your-public-key"
MP_ACCESS_TOKEN="your-access-token"

# URLs
BACKEND_URL="https://api.murallacafe.cl"
FRONTEND_URL="https://admin.murallacafe.cl"
```

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## API Endpoints

### Invoicing
- `GET /invoicing/documents` - List all documents
- `GET /invoicing/documents/:id` - Get document by ID
- `POST /invoicing/documents/import` - Import from OpenFactura
- `GET /invoicing/received-documents` - List received invoices

### Health Check
- `GET /health/healthz` - Health check endpoint

## Deployment on Render

### Build Command
```bash
npm ci --include=dev && npx prisma generate && npm run build
```

### Start Command
```bash
npm run start
```

### Pre-Deploy Command
```bash
npx prisma migrate deploy
```

## License

Private - Muralla Cafe © 2025
