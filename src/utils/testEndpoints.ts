/**
 * Test script to verify all API endpoints
 * Run with: npx tsx src/utils/testEndpoints.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  method: string,
  endpoint: string,
  data?: any,
  expectedStatus: number = 200
): Promise<void> {
  try {
    const url = `${API_URL}${endpoint}`;
    let response;

    switch (method) {
      case 'GET':
        response = await axios.get(url);
        break;
      case 'POST':
        response = await axios.post(url, data);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    const passed = response.status === expectedStatus;
    results.push({
      endpoint,
      method,
      status: passed ? 'PASS' : 'FAIL',
      statusCode: response.status,
    });

    console.log(
      `${passed ? '✅' : '❌'} ${method} ${endpoint} - ${response.status}`
    );
  } catch (error: any) {
    results.push({
      endpoint,
      method,
      status: 'FAIL',
      statusCode: error.response?.status,
      error: error.message,
    });

    console.log(
      `❌ ${method} ${endpoint} - ${error.response?.status || 'ERROR'}: ${error.message}`
    );
  }
}

async function runTests() {
  console.log('🧪 Testing BagiBerkah API Endpoints\n');
  console.log(`API URL: ${API_URL}\n`);

  // Test Health Check
  console.log('📋 Health Check:');
  await testEndpoint('GET', '/../health');
  console.log('');

  // Test AI Endpoints
  console.log('🤖 AI Endpoints:');
  await testEndpoint('POST', '/ai/allocate', {
    totalBudget: 500000,
    recipients: [
      {
        name: 'Test Recipient',
        ageLevel: 'CHILD',
        status: 'SCHOOL',
        closeness: 'VERY_CLOSE',
      },
    ],
  });

  await testEndpoint('POST', '/ai/greeting', {
    recipientName: 'Test',
    ageLevel: 'CHILD',
    context: 'Test context',
    amount: 100000,
  });
  console.log('');

  // Test Envelope Endpoints
  console.log('📨 Envelope Endpoints:');
  
  // Create envelope
  let envelopeId: string | null = null;
  try {
    const response = await axios.post(`${API_URL}/envelopes`, {
      envelopeName: 'Test Envelope',
      totalBudget: 100000,
      distributionMode: 'CASH',
      recipients: [
        {
          name: 'Test Recipient',
          ageLevel: 'CHILD',
          status: 'SCHOOL',
          closeness: 'VERY_CLOSE',
          allocatedAmount: 100000,
          aiReasoning: 'Test reasoning',
          aiGreeting: 'Test greeting',
        },
      ],
    });
    
    envelopeId = response.data.data.id;
    console.log(`✅ POST /envelopes - 201 (ID: ${envelopeId})`);
    results.push({
      endpoint: '/envelopes',
      method: 'POST',
      status: 'PASS',
      statusCode: 201,
    });
  } catch (error: any) {
    console.log(`❌ POST /envelopes - ${error.response?.status || 'ERROR'}`);
    results.push({
      endpoint: '/envelopes',
      method: 'POST',
      status: 'FAIL',
      error: error.message,
    });
  }

  if (envelopeId) {
    await testEndpoint('GET', `/envelopes/${envelopeId}`);
    await testEndpoint('GET', `/envelopes/${envelopeId}/status`);
  }
  console.log('');

  // Test Analytics Endpoints
  console.log('📊 Analytics Endpoints:');
  await testEndpoint('GET', '/analytics/dashboard');
  await testEndpoint('GET', '/analytics/envelopes');
  await testEndpoint('GET', '/analytics/payments');
  await testEndpoint('GET', '/analytics/distribution');
  await testEndpoint('GET', '/analytics/activity');
  console.log('');

  // Test Donation Endpoints
  console.log('💝 Donation Endpoints:');
  await testEndpoint('POST', '/donations/create', {
    amount: 50000,
    donorName: 'Test Donor',
    message: 'Test message',
  }, 201);
  await testEndpoint('GET', '/donations/stats');
  console.log('');

  // Summary
  console.log('📊 Test Summary:');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint}: ${r.error || 'Unknown error'}`);
      });
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
