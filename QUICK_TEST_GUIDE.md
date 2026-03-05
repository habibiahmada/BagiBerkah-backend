# Quick Test Guide - Backend

Panduan cepat untuk testing backend BagiBerkah.

## 🚀 Start Backend

```bash
cd backend
pnpm install
pnpm run dev
```

Backend akan berjalan di: `http://localhost:5000`

---

## ✅ Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T...",
  "environment": "development"
}
```

---

## 🧪 Test Endpoints

### 1. AI Allocation

```bash
curl -X POST http://localhost:5000/api/ai/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE"
      },
      {
        "name": "Sepupu",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE"
      }
    ]
  }'
```

### 2. Create Envelope

```bash
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "envelopeName": "THR Lebaran 2026",
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 300000,
        "aiReasoning": "Anak-anak mendapat porsi lebih besar",
        "aiGreeting": "Selamat Idul Fitri adik!"
      },
      {
        "name": "Sepupu",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE",
        "allocatedAmount": 200000,
        "aiReasoning": "Remaja kuliah",
        "aiGreeting": "Selamat Idul Fitri!"
      }
    ]
  }'
```

Response akan berisi `id` dan `accessCode` envelope.

### 3. Get Envelope Status

```bash
# Ganti {envelope_id} dengan ID dari response create envelope
curl http://localhost:5000/api/envelopes/{envelope_id}/status
```

### 4. Get Claim

```bash
# Ganti {claim_token} dengan token dari database atau seed
curl http://localhost:5000/api/claims/{claim_token}
```

### 5. Analytics Dashboard

```bash
curl http://localhost:5000/api/analytics/dashboard
```

---

## 🎯 Complete Flow Test

### Step 1: Create Envelope
```bash
ENVELOPE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "envelopeName": "Test THR",
    "totalBudget": 100000,
    "distributionMode": "CASH",
    "recipients": [{
      "name": "Test User",
      "ageLevel": "CHILD",
      "status": "SCHOOL",
      "closeness": "VERY_CLOSE",
      "allocatedAmount": 100000,
      "aiReasoning": "Test",
      "aiGreeting": "Test greeting"
    }]
  }')

echo $ENVELOPE_RESPONSE
```

### Step 2: Extract Envelope ID
```bash
ENVELOPE_ID=$(echo $ENVELOPE_RESPONSE | jq -r '.data.id')
echo "Envelope ID: $ENVELOPE_ID"
```

### Step 3: Get Envelope Status
```bash
curl http://localhost:5000/api/envelopes/$ENVELOPE_ID/status
```

### Step 4: Get Claim Token (from database)
```bash
# Run in backend directory
npx prisma studio
# Open Claim table and copy token
```

### Step 5: Get Claim
```bash
CLAIM_TOKEN="your_claim_token_here"
curl http://localhost:5000/api/claims/$CLAIM_TOKEN
```

### Step 6: Submit Claim (Cash Mode)
```bash
curl -X POST http://localhost:5000/api/claims/$CLAIM_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "claimMethod": "cash"
  }'
```

### Step 7: Validate QR
```bash
QR_TOKEN="your_qr_token_from_step6"
curl -X POST http://localhost:5000/api/claims/validate-qr \
  -H "Content-Type: application/json" \
  -d '{
    "qrToken": "'$QR_TOKEN'"
  }'
```

---

## 🔧 Using Postman

1. Import `postman_collection.json`
2. Set environment variable:
   - `API_URL`: `http://localhost:5000/api`
3. Run requests in order:
   - AI → Allocate
   - Envelopes → Create
   - Envelopes → Get Status
   - Claims → Get (use token from DB)
   - Claims → Submit
   - Claims → Validate QR

---

## 📊 Check Analytics

```bash
# Dashboard
curl http://localhost:5000/api/analytics/dashboard | jq

# Envelope stats
curl http://localhost:5000/api/analytics/envelopes | jq

# Payment stats
curl http://localhost:5000/api/analytics/payments | jq

# Distribution stats
curl http://localhost:5000/api/analytics/distribution | jq

# Recent activity
curl http://localhost:5000/api/analytics/activity | jq
```

---

## 🗄️ Database Management

### Open Prisma Studio
```bash
cd backend
npx prisma studio
```

Access at: `http://localhost:5555`

### View Tables
- Envelope
- Recipient
- Claim
- Payment
- Donation
- AuditLog

### Seed Database
```bash
npm run db:seed
```

---

## 🐛 Troubleshooting

### Backend tidak start
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Restart
pnpm run dev
```

### Database error
```bash
# Reset database
npx prisma migrate reset

# Push schema
npx prisma db:push

# Generate client
npx prisma generate
```

### OpenAI error
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Backend will use fallback if not set
# Check logs for: "Using rule-based allocation"
```

---

## 📝 Expected Behavior

### Mock Mode (Development)
- ✅ Payment akan redirect ke mock payment page
- ✅ Disbursement akan menggunakan mock mode
- ✅ Donation akan menggunakan mock mode
- ✅ Webhook verification di-skip (dev only)

### Production Mode
- ✅ Real Xendit payment
- ✅ Real disbursement
- ✅ Real Mayar donation
- ✅ Webhook verification aktif

---

## ✅ Success Indicators

Backend berfungsi dengan baik jika:
- ✅ Health check returns 200
- ✅ AI allocation returns recommendations
- ✅ Envelope creation returns ID and access code
- ✅ Claim token dapat diakses
- ✅ QR validation berhasil
- ✅ Analytics dashboard returns data
- ✅ No errors in console logs

---

## 🎉 Quick Verification

Run this one-liner to test all critical endpoints:

```bash
echo "Testing Health..." && \
curl -s http://localhost:5000/health | jq && \
echo "\nTesting AI..." && \
curl -s -X POST http://localhost:5000/api/ai/allocate \
  -H "Content-Type: application/json" \
  -d '{"totalBudget":100000,"recipients":[{"name":"Test","ageLevel":"CHILD","status":"SCHOOL","closeness":"VERY_CLOSE"}]}' | jq && \
echo "\nTesting Analytics..." && \
curl -s http://localhost:5000/api/analytics/dashboard | jq '.success'
```

If all return `true` or valid data, backend is working! ✅

---

**Last Updated**: March 5, 2026
