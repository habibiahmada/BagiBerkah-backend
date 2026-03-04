# Troubleshooting Guide - BagiBerkah Backend

## Common Errors & Solutions

### 1. Budget Allocation Mismatch Error

**Error Message:**
```
Total alokasi (Rp 150.000) harus sama dengan total budget (Rp 500.000). 
Selisih: Rp 350.000 kurang
```

**Error Code:** `ERR_2003`

**Cause:**
Total allocated amount dari semua recipients tidak sama dengan total budget yang ditetapkan.

**Solution:**

**Option 1: Validate Before Creating (Recommended)**
```bash
# Validate allocation first
curl -X POST http://localhost:5000/api/envelopes/validate-allocation \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {
        "name": "Adik",
        "allocatedAmount": 150000
      }
    ]
  }'

# Response will include adjusted allocation:
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
        "name": "Adik",
        "allocatedAmount": 500000
      }
    ]
  }
}
```

**Option 2: Use AI Allocation**
```bash
# Get AI recommendation first
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

# AI will return proper allocation that sums to totalBudget
```

**Option 3: Manual Calculation**
Ensure the sum of all `allocatedAmount` equals `totalBudget`:
```javascript
const totalBudget = 500000;
const recipients = [
  { name: "Adik", allocatedAmount: 200000 },
  { name: "Sepupu", allocatedAmount: 200000 },
  { name: "Keponakan", allocatedAmount: 100000 }
];

// Verify: 200000 + 200000 + 100000 = 500000 ✓
```

---

### 2. Database Connection Error

**Error Message:**
```
Can't reach database server at `localhost:5432`
```

**Cause:**
PostgreSQL is not running or connection string is incorrect.

**Solution:**

1. **Check if PostgreSQL is running:**
```bash
# Windows
Get-Service postgresql*

# Linux/Mac
sudo systemctl status postgresql
```

2. **Verify DATABASE_URL in .env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bagiberkah_db"
```

3. **Test connection:**
```bash
npm run db:studio
```

---

### 3. OpenAI API Error

**Error Message:**
```
⚠️ OPENAI_API_KEY not set - AI features will use fallback mode
```

**Cause:**
OpenAI API key is not configured or invalid.

**Solution:**

1. **Add API key to .env:**
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

2. **Verify API key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Note:** System will automatically fallback to rule-based allocation if OpenAI fails.

---

### 4. Payment Gateway Error

**Error Message:**
```
⚠️ MAYAR_API_KEY not configured, using mock payment mode
```

**Cause:**
Mayar API key is not configured.

**Solution:**

1. **For Development (Mock Mode):**
   - This is normal and expected
   - Use mock payment endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/payments/mock-success/ENVELOPE_ID
   ```

2. **For Production (Real API):**
   - Add Mayar credentials to .env:
   ```env
   MAYAR_API_KEY=your-mayar-api-key
   MAYAR_WEBHOOK_SECRET=your-webhook-secret
   MAYAR_BASE_URL=https://api.mayar.id
   ```

---

### 5. Claim Token Not Found

**Error Message:**
```
Claim not found or expired
```

**Error Code:** `ERR_3000` or `ERR_3001`

**Cause:**
- Token is invalid
- Claim has expired (30 days)
- Token was never created

**Solution:**

1. **Check if envelope was created successfully**
2. **Verify token from database:**
```bash
npm run db:studio
# Check Claims table
```

3. **Use test tokens from seed:**
```bash
npm run db:seed
# Will output test claim URLs
```

---

### 6. QR Code Already Used

**Error Message:**
```
QR code sudah digunakan
```

**Error Code:** `ERR_3005`

**Cause:**
QR token has already been validated (one-time use).

**Solution:**
- QR codes are one-time use only
- Cannot be reused for security
- Recipient needs to claim again if needed

---

### 7. TypeScript Compilation Errors

**Error Message:**
```
error TS2742: The inferred type cannot be named
```

**Cause:**
Missing type annotations in strict mode.

**Solution:**
Already fixed in latest version. If you encounter this:
```bash
npm install
npm run build
```

---

### 8. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:**
Another process is using port 5000.

**Solution:**

**Option 1: Kill the process**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Option 2: Change port**
```env
PORT=5001
```

---

### 9. Prisma Client Not Generated

**Error Message:**
```
Cannot find module '@prisma/client'
```

**Cause:**
Prisma client not generated after schema changes.

**Solution:**
```bash
npm run db:generate
```

---

### 10. Environment Variables Not Loaded

**Error Message:**
```
❌ Environment validation failed: DATABASE_URL is required
```

**Cause:**
.env file not found or not loaded.

**Solution:**

1. **Create .env file:**
```bash
cp .env.example .env
```

2. **Fill required variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bagiberkah_db"
```

3. **Restart server:**
```bash
npm run dev
```

---

## Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

Check logs:
```bash
# Error logs
cat logs/error.log

# All logs
cat logs/combined.log
```

---

## Testing Checklist

Before reporting an issue, verify:

- [ ] Database is running and accessible
- [ ] .env file exists with required variables
- [ ] Dependencies are installed (`npm install`)
- [ ] Prisma client is generated (`npm run db:generate`)
- [ ] Database schema is pushed (`npm run db:push`)
- [ ] Server is running (`npm run dev`)
- [ ] No port conflicts
- [ ] Logs don't show critical errors

---

## Getting Help

1. Check logs in `logs/` directory
2. Review API documentation in `API_DOCUMENTATION.md`
3. Test with Postman collection
4. Create issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

---

## Quick Fixes

**Reset Database:**
```bash
npm run db:push -- --force-reset
npm run db:seed
```

**Clean Install:**
```bash
rm -rf node_modules
npm install
npm run db:generate
```

**Restart Everything:**
```bash
# Stop server (Ctrl+C)
# Restart PostgreSQL
npm run dev
```
