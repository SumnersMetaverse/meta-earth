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
const rpcEndpoint = process.env.ME_RPC_ENDPOINT || 'http://localhost:26657';
const chainId = process.env.ME_CHAIN_ID || 'mechain_100-1';  // Default from readme.md
const feeDenom = process.env.ME_FEE_DENOM || 'umec';  // Default denomination
const defaultMemo = process.env.ME_TX_MEMO || '';
const forwardToAddress = process.env.ME_FORWARD_DEST;

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
const gasPrice = Number(process.env.ME_GAS_PRICE || 0.025);  // in umec
const gasLimit = Number(process.env.ME_GAS_LIMIT || 150000);

// Server configuration
const port = Number(process.env.PORT || 3000);
// ---------------------------------------------------------------------------

// Express app setup
const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

let signingClient;
let signerAddress;

/**
 * Initialize the CosmJS signing client
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

  // Create wallet from mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: signerPrefix,
  });

  const [firstAccount] = await wallet.getAccounts();
  signerAddress = firstAccount.address;
  console.log(`✓ Loaded signer address: ${signerAddress}`);

  // Create custom registry for Meta Earth chain types if needed
  const registry = new Registry();
  // Add custom message types here if Meta Earth has specific messages

  // Connect to the chain
  signingClient = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    { registry }
  );

  console.log(`✓ Connected to ${chainId} via ${rpcEndpoint}`);
  console.log(`✓ Forward destination: ${forwardToAddress}`);
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    chainId,
    signerAddress,
    connected: !!signingClient,
  });
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
 * Body: { amount: "12345", denom: "umec", fromAddress?: "me1...", memo?: "..." }
 */
app.post('/forward', async (req, res) => {
  const { amount, denom, fromAddress, memo } = req.body;

  if (!signingClient) {
    return res.status(503).json({ error: 'Signing client not ready' });
  }

  if (!amount || !denom) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['amount', 'denom'],
    });
  }

  try {
    // Prepare transaction fee
    const fee = {
      amount: coins(Math.ceil(gasPrice * gasLimit), feeDenom),
      gas: gasLimit.toString(),
    };

    console.log(`Forwarding ${amount}${denom} to ${forwardToAddress}...`);

    // Send tokens
    const result = await signingClient.sendTokens(
      fromAddress || signerAddress,
      forwardToAddress,
      coins(amount, denom),
      fee,
      memo || defaultMemo
    );

    console.log(`✓ Transaction successful: ${result.transactionHash}`);

    res.json({
      success: true,
      height: result.height,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
      rawLog: result.rawLog,
    });
  } catch (err) {
    console.error('Forwarding failed:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.toString(),
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
