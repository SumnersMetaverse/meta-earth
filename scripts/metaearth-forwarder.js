// metaearth-forwarder.js
// CosmJS Transaction Forwarder for Meta Earth Network
// Requires: node >=18, npm install @cosmjs/stargate @cosmjs/proto-signing dotenv express body-parser

import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import {
  DirectSecp256k1HdWallet,
  Registry,
} from '@cosmjs/proto-signing';
import {
  SigningStargateClient,
  coins,
} from '@cosmjs/stargate';

// ---- Configuration ---------------------------------------------------------
// Meta Earth chain configuration from repository defaults
const rpcEndpoint = process.env.ME_RPC_ENDPOINT || 'http://localhost:36657';
const chainId = process.env.ME_CHAIN_ID || 'mechain_100-1';  // Default from readme.md
const feeDenom = process.env.ME_FEE_DENOM || 'umec';  // Default denomination
const defaultMemo = process.env.ME_TX_MEMO || '';
const forwardToAddress = process.env.ME_FORWARD_DEST;

// Reliability configuration
const maxRetries = Number(process.env.ME_MAX_RETRIES || 3);
const retryDelay = Number(process.env.ME_RETRY_DELAY || 2000);
const connectionTimeout = Number(process.env.ME_CONNECTION_TIMEOUT || 30000);
const broadcastMode = process.env.ME_BROADCAST_MODE || 'sync';
const simulateTx = process.env.ME_SIMULATE_TX !== 'false';
const debugMode = process.env.ME_DEBUG_MODE === 'true';
const logTransactions = process.env.ME_LOG_TRANSACTIONS !== 'false';

// Signing key configuration with Docker secrets support
// Priority: Docker secret > Environment variable
const dockerSecretPath = process.env.ME_DOCKER_SECRET_PATH || '/run/secrets/me_signer_mnemonic';
let mnemonic = process.env.ME_SIGNER_MNEMONIC;

// Try to load mnemonic from Docker secret if available
try {
  if (!mnemonic) {
    mnemonic = readFileSync(dockerSecretPath, 'utf8').trim();
    console.log('✓ Loaded mnemonic from Docker secret');
  }
} catch (err) {
  if (!mnemonic) {
    console.error('❌ Failed to load mnemonic from Docker secret or environment variable');
    console.error('   Set ME_SIGNER_MNEMONIC or provide Docker secret at:', dockerSecretPath);
  }
}

const signerPrefix = process.env.ME_ADDRESS_PREFIX || 'me';  // Meta Earth bech32 prefix

// Gas configuration
const gasPrice = Number(process.env.ME_GAS_PRICE || 0.02);  // Updated to match minimum-gas-prices
const gasLimit = Number(process.env.ME_GAS_LIMIT || 200000);  // Increased for safety

// Validate gas configuration
if (isNaN(gasPrice) || gasPrice <= 0) {
  console.error('❌ Invalid ME_GAS_PRICE. Must be a positive number.');
  process.exit(1);
}
if (isNaN(gasLimit) || gasLimit <= 0 || !Number.isInteger(gasLimit)) {
  console.error('❌ Invalid ME_GAS_LIMIT. Must be a positive integer.');
  process.exit(1);
}

// Validate reliability configuration
if (isNaN(maxRetries) || maxRetries < 0 || !Number.isInteger(maxRetries)) {
  console.error('❌ Invalid ME_MAX_RETRIES. Must be a non-negative integer.');
  process.exit(1);
}
if (isNaN(retryDelay) || retryDelay < 0) {
  console.error('❌ Invalid ME_RETRY_DELAY. Must be a non-negative number.');
  process.exit(1);
}

// Server configuration
const port = Number(process.env.PORT || 3000);
// ---------------------------------------------------------------------------

// Express app setup
const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

let signingClient;
let signerAddress;
let lastHealthCheck = null;
let connectionHealthy = false;

/**
 * Delay utility for retry logic
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async operations
 */
async function withRetry(operation, operationName, retries = maxRetries) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✓ ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (err) {
      if (attempt <= retries) {
        console.warn(`⚠ ${operationName} failed (attempt ${attempt}/${retries + 1}): ${err.message}`);
        console.log(`  Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      } else {
        console.error(`❌ ${operationName} failed after ${retries + 1} attempts`);
        throw err;
      }
    }
  }
}

/**
 * Check RPC connection health
 */
async function checkConnectionHealth() {
  try {
    const status = await signingClient.getHeight();
    connectionHealthy = true;
    lastHealthCheck = {
      timestamp: new Date(),
      height: status,
      healthy: true,
    };
    if (debugMode) {
      console.log(`Health check passed. Current height: ${status}`);
    }
    return true;
  } catch (err) {
    connectionHealthy = false;
    lastHealthCheck = {
      timestamp: new Date(),
      healthy: false,
      error: err.message,
    };
    console.error('❌ Health check failed:', err.message);
    return false;
  }
}

/**
 * Initialize the CosmJS signing client with retry logic
 */
async function initClient() {
  if (!mnemonic) {
    throw new Error('Mnemonic not configured. Set ME_SIGNER_MNEMONIC or provide Docker secret.');
  }

  if (!forwardToAddress) {
    throw new Error('Forward destination address not configured. Set ME_FORWARD_DEST.');
  }

  console.log('Initializing Meta Earth forwarder...');
  console.log(`Chain ID: ${chainId}`);
  console.log(`RPC Endpoint: ${rpcEndpoint}`);
  console.log(`Fee Denom: ${feeDenom}`);
  console.log(`Gas Price: ${gasPrice} ${feeDenom}`);
  console.log(`Gas Limit: ${gasLimit}`);
  console.log(`Max Retries: ${maxRetries}`);
  console.log(`Retry Delay: ${retryDelay}ms`);

  // Create wallet from mnemonic with retry
  const wallet = await withRetry(
    async () => DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: signerPrefix }),
    'Wallet creation'
  );

  const [firstAccount] = await wallet.getAccounts();
  signerAddress = firstAccount.address;
  console.log(`✓ Loaded signer address: ${signerAddress}`);

  // Create custom registry for Meta Earth chain types if needed
  const registry = new Registry();
  // Add custom message types here if Meta Earth has specific messages

  // Connect to the chain with retry
  signingClient = await withRetry(
    async () => SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      wallet,
      { 
        registry,
        gasPrice: { denom: feeDenom, amount: gasPrice.toString() }
      }
    ),
    'RPC connection',
    maxRetries
  );

  console.log(`✓ Connected to ${chainId} via ${rpcEndpoint}`);
  console.log(`✓ Forward destination: ${forwardToAddress}`);

  // Verify balance
  try {
    const balance = await signingClient.getAllBalances(signerAddress);
    console.log(`✓ Signer balance:`, balance.length > 0 ? balance : 'No tokens');
    
    const mecBalance = balance.find(b => b.denom === feeDenom);
    if (!mecBalance || Number(mecBalance.amount) < gasPrice * gasLimit) {
      console.warn(`⚠ Warning: Low balance. May not have enough for gas fees.`);
    }
  } catch (err) {
    console.warn(`⚠ Could not verify balance:`, err.message);
  }

  // Start periodic health checks
  const healthCheckInterval = Number(process.env.ME_HEALTH_CHECK_INTERVAL || 60000);
  if (healthCheckInterval > 0) {
    setInterval(checkConnectionHealth, healthCheckInterval);
    await checkConnectionHealth(); // Initial health check
  }
}

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const height = await signingClient.getHeight();
    const balance = await signingClient.getAllBalances(signerAddress);
    
    res.json({
      status: 'ok',
      chainId,
      signerAddress,
      connected: !!signingClient,
      connectionHealthy,
      lastHealthCheck,
      currentHeight: height,
      signerBalance: balance,
      rpcEndpoint,
      forwardDestination: forwardToAddress,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      chainId,
      signerAddress,
      connected: !!signingClient,
      connectionHealthy: false,
      error: err.message,
    });
  }
});

/**
 * Get signer address
 */
app.get('/address', (req, res) => {
  if (!signerAddress) {
    return res.status(503).json({ error: 'Signing client not initialized' });
  }
  res.json({ address: signerAddress });
});

/**
 * Forward tokens to configured destination address
 * POST /forward
 * Body: { amount: "12345", denom: "umec", memo?: "..." }
 */
app.post('/forward', async (req, res) => {
  const { amount, denom, memo } = req.body;
  const startTime = Date.now();

  if (!signingClient) {
    return res.status(503).json({ error: 'Signing client not ready' });
  }

  if (!connectionHealthy) {
    console.warn('⚠ Attempting transaction with unhealthy connection');
  }

  if (!amount || !denom) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['amount', 'denom'],
    });
  }

  // Validate amount is a positive numeric string
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
    return res.status(400).json({ 
      error: 'Invalid amount. Must be a positive integer string.',
      provided: amount,
    });
  }

  // Validate denom format (basic check)
  if (typeof denom !== 'string' || denom.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid denom. Must be a non-empty string.',
    });
  }

  try {
    // Prepare transaction fee
    const fee = {
      amount: coins(Math.ceil(gasPrice * gasLimit), feeDenom),
      gas: gasLimit.toString(),
    };

    if (logTransactions) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Forwarding ${amount}${denom} from ${signerAddress} to ${forwardToAddress}...`);
      console.log(`Memo: ${memo || defaultMemo}`);
      console.log(`Fee: ${fee.amount[0].amount}${fee.amount[0].denom} (gas: ${fee.gas})`);
    }

    // Simulate transaction if enabled
    if (simulateTx) {
      try {
        const simulateResult = await withRetry(
          async () => signingClient.simulate(
            signerAddress,
            [{
              typeUrl: '/cosmos.bank.v1beta1.MsgSend',
              value: {
                fromAddress: signerAddress,
                toAddress: forwardToAddress,
                amount: coins(amount, denom),
              },
            }],
            memo || defaultMemo
          ),
          'Transaction simulation',
          1 // Only retry once for simulation
        );
        
        if (debugMode) {
          console.log(`✓ Simulation successful. Estimated gas: ${simulateResult}`);
        }
        
        // Adjust gas limit if simulation suggests more
        if (simulateResult > gasLimit) {
          const adjustedGas = Math.ceil(simulateResult * 1.3); // 30% buffer
          fee.gas = adjustedGas.toString();
          fee.amount = coins(Math.ceil(gasPrice * adjustedGas), feeDenom);
          console.log(`⚠ Adjusted gas limit to ${adjustedGas} based on simulation`);
        }
      } catch (simErr) {
        console.warn(`⚠ Simulation failed: ${simErr.message}`);
        console.warn(`  Proceeding with configured gas limit...`);
      }
    }

    // Send tokens with retry logic
    const result = await withRetry(
      async () => signingClient.sendTokens(
        signerAddress,
        forwardToAddress,
        coins(amount, denom),
        fee,
        memo || defaultMemo
      ),
      'Token transfer',
      maxRetries
    );

    const duration = Date.now() - startTime;

    if (logTransactions) {
      console.log(`✓ Transaction successful!`);
      console.log(`  Transaction Hash: ${result.transactionHash}`);
      console.log(`  Block Height: ${result.height}`);
      console.log(`  Gas Used: ${result.gasUsed} / ${result.gasWanted}`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`${'='.repeat(60)}\n`);
    }

    // Update health status
    connectionHealthy = true;

    res.json({
      success: true,
      height: result.height,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
      rawLog: result.rawLog,
      duration: `${duration}ms`,
      from: signerAddress,
      to: forwardToAddress,
      amount: `${amount}${denom}`,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Forwarding failed after ${duration}ms:`, err);
    
    // Check if it's a connection issue
    if (err.message.includes('connect') || err.message.includes('ECONNREFUSED')) {
      connectionHealthy = false;
      await checkConnectionHealth();
    }
    
    res.status(500).json({ 
      error: err.message,
      details: err.toString(),
      duration: `${duration}ms`,
      suggestion: 'Check RPC connection and account balance',
    });
  }
});

/**
 * Get account balance
 * GET /balance/:address
 */
app.get('/balance/:address', async (req, res) => {
  const { address } = req.params;

  if (!signingClient) {
    return res.status(503).json({ error: 'Signing client not ready' });
  }

  try {
    const balance = await signingClient.getAllBalances(address);
    res.json({
      address,
      balances: balance,
    });
  } catch (err) {
    console.error('Balance query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start the server
 */
app.listen(port, async () => {
  console.log('========================================');
  console.log('  Meta Earth Transaction Forwarder');
  console.log('========================================');
  console.log('');

  try {
    await initClient();
    console.log('');
    console.log(`✓ HTTP server ready on port ${port}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /health           - Health check');
    console.log('  GET  /address          - Get signer address');
    console.log('  POST /forward          - Forward tokens');
    console.log('  GET  /balance/:address - Get account balance');
    console.log('');
  } catch (err) {
    console.error('');
    console.error('❌ Failed to initialize signing client:');
    console.error(err.message);
    console.error('');
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
