# Test Requests - BagiBerkah API

## Correct Request Examples

### 1. Create Envelope (Correct - Budget Matches)

```bash
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 150000,
        "aiReasoning": "Anak-anak yang masih sekolah mendapat porsi lebih",
        "aiGreeting": "Selamat Idul Fitri! Semoga makin rajin belajar ya!"
      },
      {
        "name": "Sepupu Remaja",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE",
        "allocatedAmount": 200000,
        "aiReasoning": "Remaja kuliah membutuhkan biaya lebih",
        "aiGreeting": "Selamat Idul Fitri! Semoga kuliahnya lancar!"
      },
      {
        "name": "Keponakan Dewasa",
        "ageLevel": "ADULT",
        "status": "WORKING",
        "closeness": "DISTANT",
        "allocatedAmount": 150000,
        "aiReasoning": "Dewasa yang sudah bekerja mendapat porsi standar",
        "aiGreeting": "Selamat Idul Fitri. Mohon maaf lahir batin."
      }
    ]
  }'
```

**Note:** 150000 + 200000 + 150000 = 500000 ✓

---

### 2. Validate Allocation First (Recommended Workflow)

**Step 1: Get AI Allocation**
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
        "name": "Sepupu Remaja",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE"
      },
      {
        "name": "Keponakan Dewasa",
        "ageLevel": "ADULT",
        "status": "WORKING",
        "closeness": "DISTANT"
      }
    ]
  }'
```

**Step 2: Use AI Response to Create Envelope**
```bash
# Use allocations from AI response
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 180000,
        "aiReasoning": "From AI response",
        "aiGreeting": "From AI response"
      },
      {
        "name": "Sepupu Remaja",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE",
        "allocatedAmount": 200000,
        "aiReasoning": "From AI response",
        "aiGreeting": "From AI response"
      },
      {
        "name": "Keponakan Dewasa",
        "ageLevel": "ADULT",
        "status": "WORKING",
        "closeness": "DISTANT",
        "allocatedAmount": 120000,
        "aiReasoning": "From AI response",
        "aiGreeting": "From AI response"
      }
    ]
  }'
```

---

### 3. Validate Before Creating

```bash
curl -X POST http://localhost:5000/api/envelopes/validate-allocation \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {
        "name": "Adik Kecil",
        "allocatedAmount": 150000
      },
      {
        "name": "Sepupu",
        "allocatedAmount": 200000
      },
      {
        "name": "Keponakan",
        "allocatedAmount": 150000
      }
    ]
  }'
```

---

## Common Mistakes

### ❌ Wrong: Budget Mismatch

```bash
# This will FAIL
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [
      {
        "name": "Adik Kecil",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 150000
      }
    ]
  }'
```

**Error:** Total allocated (150000) ≠ Total budget (500000)

---

### ❌ Wrong: Missing Required Fields

```bash
# This will FAIL
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {
        "name": "Adik Kecil",
        "allocatedAmount": 500000
      }
    ]
  }'
```

**Error:** Missing required fields (ageLevel, status, closeness, distributionMode)

---

## Complete Workflow Example

### Scenario: Create envelope for 3 recipients with Rp 500.000

**1. Get AI Recommendation:**
```bash
curl -X POST http://localhost:5000/api/ai/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {"name": "Adik", "ageLevel": "CHILD", "status": "SCHOOL", "closeness": "VERY_CLOSE"},
      {"name": "Sepupu", "ageLevel": "TEEN", "status": "COLLEGE", "closeness": "CLOSE"},
      {"name": "Keponakan", "ageLevel": "ADULT", "status": "WORKING", "closeness": "DISTANT"}
    ]
  }'
```

**2. Generate Greetings (Optional):**
```bash
curl -X POST http://localhost:5000/api/ai/greeting \
  -H "Content-Type: application/json" \
  -d '{
    "recipientName": "Adik Kecil",
    "ageLevel": "CHILD",
    "context": "Rajin puasa dan mengaji",
    "amount": 180000
  }'
```

**3. Validate Allocation:**
```bash
curl -X POST http://localhost:5000/api/envelopes/validate-allocation \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "recipients": [
      {"name": "Adik", "allocatedAmount": 180000},
      {"name": "Sepupu", "allocatedAmount": 200000},
      {"name": "Keponakan", "allocatedAmount": 120000}
    ]
  }'
```

**4. Create Envelope:**
```bash
curl -X POST http://localhost:5000/api/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 500000,
    "distributionMode": "CASH",
    "recipients": [
      {
        "name": "Adik",
        "ageLevel": "CHILD",
        "status": "SCHOOL",
        "closeness": "VERY_CLOSE",
        "allocatedAmount": 180000,
        "aiReasoning": "...",
        "aiGreeting": "..."
      },
      {
        "name": "Sepupu",
        "ageLevel": "TEEN",
        "status": "COLLEGE",
        "closeness": "CLOSE",
        "allocatedAmount": 200000,
        "aiReasoning": "...",
        "aiGreeting": "..."
      },
      {
        "name": "Keponakan",
        "ageLevel": "ADULT",
        "status": "WORKING",
        "closeness": "DISTANT",
        "allocatedAmount": 120000,
        "aiReasoning": "...",
        "aiGreeting": "..."
      }
    ]
  }'
```

**5. Get Envelope Status:**
```bash
curl http://localhost:5000/api/envelopes/ENVELOPE_ID/status
```

---

## Testing with Seed Data

After running `npm run db:seed`, you'll get test claim URLs:

```bash
# Example output:
🔗 Test Claim URLs:
   Adik Kecil: http://localhost:3000/claim/791c36ebc2dfae5cfbe8ac242a4e9235
   Sepupu Remaja: http://localhost:3000/claim/948c09d8b92e68cda056fe09db8c7bd2
   Keponakan Dewasa: http://localhost:3000/claim/5ea3a819f5b36fcda011db23c15ceb01
```

Test claim:
```bash
curl http://localhost:5000/api/claims/791c36ebc2dfae5cfbe8ac242a4e9235
```

---

## Quick Reference

**Budget Calculation:**
```
Total Budget = Sum of all allocatedAmount

Example:
totalBudget: 500000
recipients:
  - allocatedAmount: 180000
  - allocatedAmount: 200000
  - allocatedAmount: 120000
Total: 180000 + 200000 + 120000 = 500000 ✓
```

**Minimum Allocation:**
- Minimum per recipient: Rp 10.000
- Maximum: No limit (as long as total matches budget)
