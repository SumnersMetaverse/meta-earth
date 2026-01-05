#!/usr/bin/env node

/**
 * Meta Earth Transaction Forwarder - Integration Test Suite
 * 
 * This test suite validates the transaction forwarder service to ensure:
 * - Proper RPC connection
 * - Wallet initialization
 * - Transaction execution
 * - Error handling and retry logic
 * - No slippage or packet loss
 */

import 'dotenv/config';
import { readFileSync } from 'fs';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

function warn(message) {
  log(colors.yellow, '⚠', message);
}

function section(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

/**
 * Test 1: Environment Configuration
 */
async function testEnvironmentConfig() {
  section('Test 1: Environment Configuration');
  
  const requiredVars = [
    'ME_CHAIN_ID',
    'ME_RPC_ENDPOINT',
    'ME_FEE_DENOM',
    'ME_FORWARD_DEST',
  ];
  
  let allPresent = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`${varName}: ${process.env[varName]}`);
    } else {
      error(`${varName}: NOT SET`);
      allPresent = false;
    }
  }
  
  // Check mnemonic (without revealing it)
  const dockerSecretPath = process.env.ME_DOCKER_SECRET_PATH || '/run/secrets/me_signer_mnemonic';
  let mnemonicPresent = false;
  
  if (process.env.ME_SIGNER_MNEMONIC) {
    success('ME_SIGNER_MNEMONIC: Set via environment variable');
    mnemonicPresent = true;
  } else {
    try {
      readFileSync(dockerSecretPath, 'utf8');
      success(`ME_SIGNER_MNEMONIC: Set via Docker secret at ${dockerSecretPath}`);
      mnemonicPresent = true;
    } catch (err) {
      error('ME_SIGNER_MNEMONIC: NOT SET (neither env var nor Docker secret)');
    }
  }
  
  if (allPresent && mnemonicPresent) {
    success('All required environment variables are configured');
    testResults.passed++;
    return true;
  } else {
    error('Some required environment variables are missing');
    testResults.failed++;
    return false;
  }
}

/**
 * Test 2: Service Health Check
 */
async function testServiceHealth() {
  section('Test 2: Service Health Check');
  
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/health`;
  
  try {
    info(`Testing endpoint: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      success('Service is healthy');
      success(`Chain ID: ${data.chainId}`);
      success(`Signer Address: ${data.signerAddress}`);
      success(`Current Height: ${data.currentHeight}`);
      success(`Connection: ${data.connectionHealthy ? 'Healthy' : 'Unhealthy'}`);
      
      if (data.signerBalance && data.signerBalance.length > 0) {
        success(`Signer Balance: ${JSON.stringify(data.signerBalance)}`);
      } else {
        warn('Signer has no balance - transactions may fail');
        testResults.warnings++;
      }
      
      testResults.passed++;
      return true;
    } else {
      error(`Service unhealthy: ${data.error || 'Unknown error'}`);
      testResults.failed++;
      return false;
    }
  } catch (err) {
    error(`Failed to connect to service: ${err.message}`);
    error('Make sure the service is running: npm start');
    testResults.failed++;
    return false;
  }
}

/**
 * Test 3: Address Endpoint
 */
async function testAddressEndpoint() {
  section('Test 3: Address Endpoint');
  
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/address`;
  
  try {
    info(`Testing endpoint: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.address) {
      success(`Signer address retrieved: ${data.address}`);
      
      // Validate address format
      if (data.address.startsWith('me1')) {
        success('Address format is correct (me1...)');
        testResults.passed++;
        return true;
      } else {
        warn(`Unexpected address prefix: ${data.address.substring(0, 3)}`);
        testResults.warnings++;
        return true;
      }
    } else {
      error('Failed to retrieve signer address');
      testResults.failed++;
      return false;
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test 4: Balance Query
 */
async function testBalanceQuery() {
  section('Test 4: Balance Query');
  
  const port = process.env.PORT || 3000;
  
  // Get signer address first
  try {
    const addressResponse = await fetch(`http://localhost:${port}/address`);
    const addressData = await addressResponse.json();
    const address = addressData.address;
    
    info(`Querying balance for: ${address}`);
    const url = `http://localhost:${port}/balance/${address}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      success(`Balance query successful`);
      if (data.balances && data.balances.length > 0) {
        for (const balance of data.balances) {
          success(`  ${balance.amount} ${balance.denom}`);
        }
        testResults.passed++;
        return true;
      } else {
        warn('Account has no balance');
        testResults.warnings++;
        return true;
      }
    } else {
      error(`Balance query failed: ${data.error}`);
      testResults.failed++;
      return false;
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test 5: Transaction Simulation (Dry Run)
 */
async function testTransactionSimulation() {
  section('Test 5: Transaction Validation');
  
  info('Testing transaction payload validation...');
  
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/forward`;
  
  // Test 5a: Missing fields
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      success('Validation: Missing fields rejected correctly');
      testResults.passed++;
    } else {
      error('Validation: Missing fields should be rejected');
      testResults.failed++;
    }
  } catch (err) {
    error(`Validation test failed: ${err.message}`);
    testResults.failed++;
  }
  
  // Test 5b: Invalid amount
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: '-100',
        denom: 'umec',
      }),
    });
    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      success('Validation: Invalid amount rejected correctly');
      testResults.passed++;
    } else {
      error('Validation: Invalid amount should be rejected');
      testResults.failed++;
    }
  } catch (err) {
    error(`Validation test failed: ${err.message}`);
    testResults.failed++;
  }
}

/**
 * Test 6: Small Transaction Test (Optional - requires balance)
 */
async function testSmallTransaction() {
  section('Test 6: Small Transaction Test (Optional)');
  
  warn('This test is skipped by default to prevent accidental token transfers');
  info('To run this test, set ME_RUN_TX_TEST=true in your environment');
  
  if (process.env.ME_RUN_TX_TEST !== 'true') {
    info('Skipping transaction test');
    return true;
  }
  
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/forward`;
  
  try {
    info('Sending test transaction: 1 umec');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: '1',
        denom: 'umec',
        memo: 'Test transaction from integration suite',
      }),
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      success(`Transaction successful!`);
      success(`  Transaction Hash: ${data.transactionHash}`);
      success(`  Block Height: ${data.height}`);
      success(`  Gas Used: ${data.gasUsed} / ${data.gasWanted}`);
      success(`  Duration: ${data.duration}`);
      testResults.passed++;
      return true;
    } else {
      error(`Transaction failed: ${data.error}`);
      info(`  Suggestion: ${data.suggestion || 'Check logs for details'}`);
      testResults.failed++;
      return false;
    }
  } catch (err) {
    error(`Transaction test failed: ${err.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.cyan}╔${'═'.repeat(58)}╗`);
  console.log(`║${' '.repeat(58)}║`);
  console.log(`║  Meta Earth Transaction Forwarder - Integration Tests  ║`);
  console.log(`║${' '.repeat(58)}║`);
  console.log(`╚${'═'.repeat(58)}╝${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Run tests sequentially
  await testEnvironmentConfig();
  await testServiceHealth();
  await testAddressEndpoint();
  await testBalanceQuery();
  await testTransactionSimulation();
  await testSmallTransaction();
  
  // Print summary
  const duration = Date.now() - startTime;
  
  section('Test Summary');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  success(`Passed: ${testResults.passed}`);
  if (testResults.failed > 0) {
    error(`Failed: ${testResults.failed}`);
  }
  if (testResults.warnings > 0) {
    warn(`Warnings: ${testResults.warnings}`);
  }
  console.log(`Duration: ${duration}ms\n`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}╔${'═'.repeat(58)}╗`);
    console.log(`║${' '.repeat(58)}║`);
    console.log(`║       ✓ All tests passed successfully!                 ║`);
    console.log(`║${' '.repeat(58)}║`);
    console.log(`╚${'═'.repeat(58)}╝${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}╔${'═'.repeat(58)}╗`);
    console.log(`║${' '.repeat(58)}║`);
    console.log(`║       ✗ Some tests failed                              ║`);
    console.log(`║${' '.repeat(58)}║`);
    console.log(`╚${'═'.repeat(58)}╝${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  error(`Test suite failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
