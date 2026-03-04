# BagiBerkah API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
Currently, the API does not require authentication. All endpoints are public.

---

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T04:00:00.000Z"
}
```

---

## AI Endpoints

### POST /api/ai/allocate
Get AI recommendation for THR allocation.

**Request Body:**
```json
{
  "totalBudget": 500000,
  "recipients": [
    {
      "name": "Adik Kecil",
      "ageLevel": "CHILD",
      "status": "SCHOOL",
      "closeness": "VERY_CLOSE"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allocations": [
      {
        "recipientIndex": 0,
        "amount": 150000,
        "reasoning": "Anak-anak yang masih sekolah..."
      }
    ],
    "totalAllocated": 500000
  }
}
```

### POST /api/ai/greeting
Generate personal greeting message.

**Request Body:**
```json
{
  "recipientName": "Adik Kecil",
  "ageLevel": "CHILD",
  "context": "Rajin puasa dan mengaji",
  "amount": 150000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": "Selamat Idul Fitri adik kecil!...",
    "tone": "cheerful"
  }
}
```

---

## Envelope Endpoints

### POST /api/envelopes
Create a new THR envelope.

**Important:** Total `allocatedAmount` dari semua recipients harus sama dengan `totalBudget`.

**Request Body:**
```json
{
  "totalBudget": 500000,
  "distributionMode": "CASH",
  "recipients": [
    {
      "name": "Adik Kecil",
      "ageLevel": "CHILD",
      "status": "SCHOOL",
      "closeness": "VERY_CLOSE",
      "allocatedAmount": 150000,
      "aiReasoning": "...",
      "aiGreeting": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "envelope_id",
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "status": "ACTIVE",
    "recipients": [...],
    "createdAt": "2026-03-05T04:00:00.000Z"
  }
}
```

**Error Response (Budget Mismatch):**
```json
{
  "success": false,
  "error": {
    "code": "ERR_2003",
    "message": "Total alokasi (Rp 150.000) harus sama dengan total budget (Rp 500.000). Selisih: Rp 350.000 kurang"
  }
}
```

### POST /api/envelopes/validate-allocation
Validate allocation before creating envelope. Returns adjusted allocation if invalid.

**Request Body:**
```json
{
  "totalBudget": 500000,
  "recipients": [
    {
      "name": "Adik Kecil",
      "allocatedAmount": 150000
    }
  ]
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "valid": false,
  "message": "Total alokasi Rp 150.000 kurang Rp 350.000 dari budget Rp 500.000",
  "data": {
    "totalBudget": 500000,
    "totalAllocated": 150000,
    "difference": 350000,
    "adjustedRecipients": [
      {
        "name": "Adik Kecil",
        "allocatedAmount": 500000
      }
    ]
  }
}
```

**Response (Valid):**
```json
{
  "success": true,
  "valid": true,
  "message": "Alokasi sudah sesuai dengan budget",
  "data": {
    "totalBudget": 500000,
    "totalAllocated": 500000
  }
}
```

### GET /api/envelopes/:id
Get envelope details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "envelope_id",
    "totalBudget": 500000,
    "recipients": [...],
    "payment": {...}
  }
}
```

### GET /api/envelopes/:id/status
Get envelope status and claim tracking.

**Response:**
```json
{
  "success": true,
  "data": {
    "envelopeId": "envelope_id",
    "status": "ACTIVE",
    "totalRecipients": 3,
    "claimedCount": 1,
    "pendingCount": 2,
    "recipients": [...]
  }
}
```

---

## Claim Endpoints

### GET /api/claims/:token
Get claim details by token.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "claim_token",
    "recipientName": "Adik Kecil",
    "amount": 150000,
    "greeting": "Selamat Idul Fitri!",
    "status": "PENDING",
    "qrToken": "qr_token",
    "expiresAt": "2026-04-05T04:00:00.000Z",
    "distributionMode": "CASH"
  }
}
```

### POST /api/claims/:token
Submit claim (digital or cash).

**Request Body (Digital):**
```json
{
  "claimMethod": "digital",
  "bankAccount": "1234567890",
  "bankName": "BCA"
}
```

**Request Body (Cash):**
```json
{
  "claimMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": "claim_id",
    "status": "CLAIMED",
    "qrToken": "qr_token",
    "claimMethod": "cash",
    "message": "Tunjukkan QR code saat bertemu untuk validasi"
  }
}
```

### POST /api/claims/validate-qr
Validate QR code for cash mode.

**Request Body:**
```json
{
  "qrToken": "qr_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "recipientName": "Adik Kecil",
    "amount": 150000,
    "claimId": "claim_id",
    "message": "QR code validated successfully"
  }
}
```

---

## Payment Endpoints

### POST /api/payments/create
Create payment session for digital mode.

**Request Body:**
```json
{
  "envelopeId": "envelope_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "paymentUrl": "https://payment-gateway.com/pay/...",
    "amount": 500000,
    "status": "PENDING",
    "expiresAt": "2026-03-06T04:00:00.000Z"
  }
}
```

### GET /api/payments/:paymentId/status
Get payment status.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "status": "SUCCESS",
    "amount": 500000,
    "paidAt": "2026-03-05T04:30:00.000Z",
    "envelopeId": "envelope_id"
  }
}
```

### POST /api/payments/mock-success/:envelopeId
Simulate payment success (development only).

**Response:**
```json
{
  "success": true,
  "message": "Payment simulated successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message in Indonesian"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ERR_1001` | 400 | Validation error |
| `ERR_1002` | 404 | Not found |
| `ERR_2000` | 404 | Envelope not found |
| `ERR_3000` | 404 | Claim not found |
| `ERR_3001` | 410 | Claim expired |
| `ERR_3002` | 400 | Claim already processed |
| `ERR_4000` | 404 | Payment not found |
| `ERR_4001` | 400 | Payment failed |

---

## Data Types

### AgeLevel
- `CHILD` - 0-12 years
- `TEEN` - 13-17 years
- `ADULT` - 18+ years

### Status
- `SCHOOL` - Sekolah
- `COLLEGE` - Kuliah
- `WORKING` - Bekerja
- `NOT_WORKING` - Belum bekerja

### Closeness
- `VERY_CLOSE` - Sangat dekat
- `CLOSE` - Cukup dekat
- `DISTANT` - Jauh

### DistributionMode
- `DIGITAL` - Transfer digital
- `CASH` - Uang tunai dengan QR validation

### EnvelopeStatus
- `DRAFT` - Draft
- `PENDING_PAYMENT` - Menunggu pembayaran
- `ACTIVE` - Aktif
- `COMPLETED` - Selesai
- `EXPIRED` - Kadaluarsa

### ClaimStatus
- `PENDING` - Belum dibuka
- `OPENED` - Sudah dibuka
- `CLAIMED` - Sudah diklaim
- `VALIDATED` - Sudah divalidasi (cash mode)
- `EXPIRED` - Kadaluarsa

---

## Testing

### Using Postman
Import `postman_collection.json` to Postman for easy testing.

### Using cURL

**Create Envelope:**
```bash
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [...]
  }'
```

**Get Claim:**
```bash
curl http://localhost:5000/api/claims/YOUR_TOKEN_HERE
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Applies to all endpoints

---

## Support

For issues or questions:
- GitHub: [Repository URL]
- Email: support@bagiberkah.com
