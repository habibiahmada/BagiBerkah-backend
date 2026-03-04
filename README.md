# BagiBerkah Backend

Backend API untuk BagiBerkah - AI-Powered THR Experience built with Node.js, Express, TypeScript, dan Prisma.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI**: OpenAI API (GPT-4o-mini/GPT-4o)
- **Payment**: Mayar Gateway
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Zod

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma client
│   │   └── openai.ts        # OpenAI client
│   ├── controllers/         # Request handlers
│   │   ├── envelope.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── claim.controller.ts
│   │   └── payment.controller.ts
│   ├── services/            # Business logic
│   │   ├── envelope.service.ts
│   │   ├── ai.service.ts
│   │   ├── claim.service.ts
│   │   └── payment.service.ts
│   ├── routes/              # API routes
│   │   ├── index.ts
│   │   ├── envelope.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── claim.routes.ts
│   │   └── payment.routes.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validator.ts
│   ├── validators/          # Zod schemas
│   │   ├── envelope.validator.ts
│   │   ├── ai.validator.ts
│   │   ├── claim.validator.ts
│   │   └── payment.validator.ts
│   └── index.ts             # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## 🛠 Setup & Installation

### Prerequisites

- Node.js 18+ atau 20+
- PostgreSQL 14+
- npm atau pnpm

### Installation

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bagiberkah"

# JWT
JWT_SECRET=your-secret-key

# OpenAI
OPENAI_API_KEY=sk-your-key

# Mayar Payment
MAYAR_API_KEY=your-key
MAYAR_WEBHOOK_SECRET=your-secret
MAYAR_BASE_URL=https://api.mayar.id

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Run Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:5000**

## 📡 API Endpoints

### Health Check

```
GET /health
```

### Envelope APIs

```
POST   /api/envelopes          # Create envelope
GET    /api/envelopes/:id      # Get envelope
GET    /api/envelopes/:id/status  # Get status
PATCH  /api/envelopes/:id      # Update envelope
```

### AI APIs

```
POST   /api/ai/allocate        # Get AI allocation
POST   /api/ai/greeting        # Generate greeting
```

### Claim APIs

```
GET    /api/claims/:token      # Get claim
POST   /api/claims/:token      # Submit claim
POST   /api/claims/validate-qr # Validate QR
```

### Payment APIs

```
POST   /api/payments/create    # Create payment
GET    /api/payments/:id/status # Get status
POST   /api/payments/webhook   # Webhook handler
```

## 🔌 API Usage Examples

### Create Envelope

```bash
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 1000000,
    "distributionMode": "DIGITAL",
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 500000,
        "aiGreeting": "Selamat Idul Fitri!"
      }
    ]
  }'
```

### Get AI Allocation

```bash
curl -X POST http://localhost:5000/api/ai/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 1000000,
    "recipients": [
      {
        "name": "Adik A",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE"
      },
      {
        "name": "Sepupu B",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE"
      }
    ]
  }'
```

## 🗄 Database Schema

### Models

- **Envelope**: Main envelope data
- **Recipient**: Recipient information
- **Claim**: Claim tokens and status
- **Payment**: Payment transactions
- **AuditLog**: Audit trail

### Enums

- **AgeLevel**: CHILD, TEEN, ADULT
- **Status**: SCHOOL, COLLEGE, WORKING, NOT_WORKING
- **Closeness**: VERY_CLOSE, CLOSE, DISTANT
- **DistributionMode**: DIGITAL, CASH
- **EnvelopeStatus**: DRAFT, PENDING_PAYMENT, ACTIVE, COMPLETED, EXPIRED
- **ClaimStatus**: PENDING, OPENED, CLAIMED, VALIDATED, EXPIRED
- **PaymentStatus**: PENDING, SUCCESS, FAILED, EXPIRED

## 🤖 AI Integration

### AI Allocation

AI menggunakan GPT-4o-mini untuk:
- Menganalisis data penerima
- Menghitung skor berdasarkan usia, status, kedekatan
- Memberikan rekomendasi pembagian yang adil
- Memberikan reasoning untuk setiap alokasi

### Fallback

Jika AI gagal, sistem menggunakan rule-based allocation:
- Scoring system berbasis variabel
- Proporsi berdasarkan total score
- Adjustment untuk memastikan total match

### AI Greeting

AI generate greeting personal untuk setiap penerima:
- Age-appropriate tone
- Context-aware
- Warm and personal
- Template fallback jika AI gagal

## 💳 Payment Integration

### Mayar Gateway

Backend terintegrasi dengan Mayar untuk:
- Create payment session
- Handle payment callback
- Verify webhook signature
- Update payment status

### Mock Mode

Jika `MAYAR_API_KEY` tidak diset, sistem menggunakan mock payment untuk development.

## 🔐 Security

### Implemented

- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation with Zod
- ✅ Error handling
- ✅ Secure token generation
- ✅ Webhook signature verification

### Best Practices

- Environment variables for secrets
- SQL injection prevention (Prisma)
- XSS prevention
- CSRF protection
- Audit logging

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 Development

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Build TypeScript
npm start            # Production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
```

### Adding New Endpoint

1. Create validator in `validators/`
2. Create service in `services/`
3. Create controller in `controllers/`
4. Create route in `routes/`
5. Add route to `routes/index.ts`

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Reset database
npm run db:push -- --force-reset
```

### OpenAI API Error

```bash
# Check API key
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Port Already in Use

```bash
# Find process
lsof -ti:5000

# Kill process
kill -9 <PID>
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables (Production)

Ensure all environment variables are set:
- `DATABASE_URL` - Production database
- `OPENAI_API_KEY` - OpenAI API key
- `MAYAR_API_KEY` - Mayar API key
- `JWT_SECRET` - Strong secret key
- `FRONTEND_URL` - Production frontend URL

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🆘 Need Help?

1. Check logs: `npm run dev` output
2. Check database: `npm run db:studio`
3. Check API: Use Postman/Thunder Client
4. Check environment variables
5. Check documentation

---

**Backend BagiBerkah - Ready for Development! 🚀**

*Last Updated: March 2026*
