# BagiBerkah Backend

Backend API for BagiBerkah - AI-Powered THR Experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database:**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data (optional)
npm run db:seed
```

4. **Start development server:**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## 📋 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional (will use mock/fallback if not set):
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `XENDIT_API_KEY` - Xendit API key for THR payment & disbursement
- `XENDIT_WEBHOOK_SECRET` - Xendit webhook secret for verification
- `MAYAR_API_KEY` - Mayar API key for support developer feature
- `MAYAR_WEBHOOK_SECRET` - Mayar webhook secret
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

See `.env.example` for all available variables.

### Payment Gateway Configuration

**Xendit (THR System)**:
- Used for main THR payment collection and disbursement
- Requires `XENDIT_API_KEY` for production
- Sandbox mode available for testing
- Base URL: `https://api.xendit.co` (production) or `https://api.xendit.co` (sandbox uses same URL with test keys)

**Mayar (Support Developer)**:
- Used for donation and support developer features
- Requires `MAYAR_API_KEY` for production
- Sandbox: `https://api.mayar.club/hl/v1`
- Production: `https://api.mayar.id`

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client
│   │   ├── openai.ts    # OpenAI client
│   │   ├── logger.ts    # Winston logger
│   │   └── env.ts       # Environment validation
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   │   ├── ai.service.ts
│   │   ├── envelope.service.ts
│   │   ├── claim.service.ts
│   │   ├── payment.service.ts
│   │   └── disbursement.service.ts
│   ├── routes/          # API routes
│   ├── middlewares/     # Express middlewares
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── validator.ts
│   │   └── requestLogger.ts
│   ├── validators/      # Zod schemas
│   ├── utils/           # Utility functions
│   │   └── errorCodes.ts
│   ├── prisma/          # Database
│   │   └── seed.ts      # Seed script
│   └── index.ts         # Entry point
├── logs/                # Log files
├── prisma/
│   └── schema.prisma    # Database schema
├── postman_collection.json
├── API_DOCUMENTATION.md
└── README.md
```

---

## 🔌 API Endpoints

### Base URL: `/api`

**AI:**
- `POST /ai/allocate` - Get AI allocation recommendation
- `POST /ai/greeting` - Generate personal greeting

**Envelopes:**
- `POST /envelopes` - Create envelope
- `GET /envelopes/:id` - Get envelope
- `GET /envelopes/:id/status` - Get status

**Claims:**
- `GET /claims/:token` - Get claim
- `POST /claims/:token` - Submit claim
- `POST /claims/validate-qr` - Validate QR

**Payments:**
- `POST /payments/create` - Create payment
- `GET /payments/:paymentId/status` - Get status
- `POST /payments/mock-success/:envelopeId` - Mock payment (dev only)

See `API_DOCUMENTATION.md` for detailed documentation.

---

## 🧪 Testing

### Using Postman
Import `postman_collection.json` to Postman.

### Using cURL
```bash
# Health check
curl http://localhost:5000/health

# Get claim (use token from seed)
curl http://localhost:5000/api/claims/YOUR_TOKEN_HERE

# AI allocation
curl -X POST http://localhost:5000/api/ai/allocate \
  -H "Content-Type: application/json" \
  -d '{"totalBudget": 500000, "recipients": [...]}'
```

### Test Data
After running `npm run db:seed`, you'll get test claim URLs in the console.

---

## 🔐 Security Features

- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation with Zod
- ✅ Webhook signature verification
- ✅ Structured error handling
- ✅ Request logging

---

## 📊 Logging

Logs are stored in `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

Log level can be configured via `LOG_LEVEL` environment variable.

---

## 🚀 Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Environment
Set `NODE_ENV=production` in production environment.

---

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create migration
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database
- `npm run lint` - Run ESLint

### Database Migrations
```bash
# Create migration
npm run db:migrate

# Apply migrations
npm run db:push
```

---

## 🔧 Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### OpenAI API Error
- Check `OPENAI_API_KEY` in `.env`
- System will fallback to rule-based allocation if key is invalid

### Payment Gateway Error
- **Xendit**: Check `XENDIT_API_KEY` in `.env`
  - System will use mock mode if key is not set
  - Verify API key has disbursement permission
- **Mayar**: Check `MAYAR_API_KEY` in `.env`
  - Used only for support developer feature
  - Not required for main THR functionality

---

## 📝 Features

### ✅ Implemented
- AI-powered allocation recommendation
- AI-generated personal greetings
- Envelope creation and management
- Claim system with token validation
- QR code validation for cash mode
- **Hybrid payment gateway integration**:
  - Xendit for THR payment collection & disbursement
  - Mayar for support developer feature
- Automatic disbursement to recipients
- Mock mode for development
- Structured logging
- Error handling with error codes
- Environment validation
- API documentation

### 🔄 Fallback Modes
- **AI Service**: Falls back to rule-based allocation if OpenAI API fails
- **Payment (Xendit)**: Uses mock mode if API key not configured
- **Disbursement (Xendit)**: Uses mock mode if API key not configured
- **Donation (Mayar)**: Optional feature, not required for core functionality

---

## 📚 Documentation

- `API_DOCUMENTATION.md` - Complete API documentation
- `postman_collection.json` - Postman collection for testing
- `prisma/schema.prisma` - Database schema documentation

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request

---

## 📄 License

Private - BagiBerkah Project

---

## 📞 Support

For issues or questions, please create an issue in the repository.
