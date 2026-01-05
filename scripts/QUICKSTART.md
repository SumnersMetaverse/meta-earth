# Meta Earth Transaction Forwarder - Quick Start Guide

This guide walks you through setting up and testing the Meta Earth transaction forwarder with a local Meta Earth node.

## Prerequisites

- Node.js >= 18.0.0
- Go >= 1.23 (for running Meta Earth node)
- Git

## Step 1: Set Up Local Meta Earth Node

From the repository root:

```bash
# Initialize and start the local Meta Earth node
cd /path/to/meta-earth
bash setup_local.sh

# In a separate terminal, start the node
med start
```

The local node will be available at:
- RPC: http://localhost:36657
- API: http://localhost:1318

## Step 2: Configure the Forwarder

```bash
cd scripts

# Copy the production configuration
cp .env.production .env

# The configuration is pre-filled with Meta Earth defaults:
# - Chain ID: mechain_100-1
# - RPC: http://localhost:36657
# - Denom: umec
# - Gas Price: 0.02 umec (matches minimum-gas-prices)
# - Destination: me139mq752delxv78jvtmwxhasyrycufsvr0mue6u (Global DAO)
```

### Configure Mnemonic (Choose One)

#### Option A: Use Test Mnemonic from setup_local.sh

Edit `.env` and uncomment this line:
```bash
ME_SIGNER_MNEMONIC=curtain hat remain song receive tower stereo hope frog cheap brown plate raccoon post reflect wool sail salmon game salon group glimpse adult shift
```

#### Option B: Use Your Own Mnemonic

Edit `.env` and set your own mnemonic:
```bash
ME_SIGNER_MNEMONIC=your 24-word mnemonic phrase here
```

#### Option C: Use Docker Secrets (Production)

```bash
mkdir -p secrets
echo "your 24-word mnemonic" > secrets/me_signer_mnemonic.txt
chmod 600 secrets/me_signer_mnemonic.txt
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Forwarder

```bash
npm start
```

You should see:
```
========================================
  Meta Earth Transaction Forwarder
========================================

Initializing Meta Earth forwarder...
Chain ID: mechain_100-1
RPC Endpoint: http://localhost:36657
Fee Denom: umec
Gas Price: 0.02 umec
Gas Limit: 200000
Max Retries: 3
Retry Delay: 2000ms
✓ Loaded signer address: me1...
✓ Connected to mechain_100-1 via http://localhost:36657
✓ Forward destination: me139mq752delxv78jvtmwxhasyrycufsvr0mue6u
✓ Signer balance: [...]

✓ HTTP server ready on port 3000
```

## Step 5: Run Tests

In a new terminal:

```bash
cd scripts
npm test
```

This will run comprehensive tests including:
- ✓ Environment configuration validation
- ✓ Service health check
- ✓ Address endpoint test
- ✓ Balance query test
- ✓ Transaction validation test

### Optional: Run Transaction Test

To test an actual token transfer (sends 1 umec):

```bash
npm run test:tx
```

## Step 6: Test Manually

### Check Health
```bash
curl http://localhost:3000/health
```

### Get Signer Address
```bash
curl http://localhost:3000/address
```

### Check Balance
```bash
curl http://localhost:3000/balance/me1youraddresshere
```

### Forward Tokens
```bash
curl -X POST http://localhost:3000/forward \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000000",
    "denom": "umec",
    "memo": "Test forward"
  }'
```

## Expected Behavior

### Successful Transaction
```json
{
  "success": true,
  "height": 12345,
  "transactionHash": "ABC123...",
  "gasUsed": 125000,
  "gasWanted": 200000,
  "duration": "234ms",
  "from": "me1...",
  "to": "me139mq752delxv78jvtmwxhasyrycufsvr0mue6u",
  "amount": "1000000umec"
}
```

### Features in Action

1. **Retry Logic**: If a transaction fails, it will retry up to 3 times
2. **Transaction Simulation**: Before sending, simulates to estimate gas
3. **Health Monitoring**: Periodic checks ensure RPC connection is healthy
4. **Detailed Logging**: All transactions logged with timing and gas info
5. **Balance Verification**: Checks balance on startup and warns if low

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:36657
```

**Solution**: Make sure Meta Earth node is running:
```bash
med status
# or
curl http://localhost:36657/status
```

### Insufficient Balance
```
Error: insufficient funds
```

**Solution**: Send tokens to your signer address:
```bash
med tx bank send source-address <your-signer-address> 1000000umec \
  --chain-id mechain_100-1 \
  --keyring-backend test \
  --yes
```

### Invalid Chain ID
```
Error: chain-id mismatch
```

**Solution**: Verify chain ID matches:
```bash
med status | jq -r .NodeInfo.network
```

## Production Deployment

For production, use Docker with secrets:

```bash
# Use the production environment file
cp .env.production .env

# Set up Docker secrets
mkdir -p secrets
echo "your-production-mnemonic" > secrets/me_signer_mnemonic.txt
chmod 600 secrets/me_signer_mnemonic.txt

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f metaearth-forwarder
```

## Configuration Reference

See `.env.production` for all configuration options with detailed comments, including:

- Network endpoints (RPC, API, gRPC)
- Gas prices and limits
- Retry behavior
- Health check intervals
- Logging options
- Connection timeouts

## Security Best Practices

1. **Never commit mnemonics** - Use Docker secrets or environment variables
2. **Use dedicated wallet** - Don't use your main wallet for the forwarder
3. **Limit balance** - Keep only necessary funds in the forwarder wallet
4. **Enable HTTPS** - Use a reverse proxy (nginx/caddy) in production
5. **Restrict access** - Use firewall rules and API authentication
6. **Monitor logs** - Set up log aggregation and alerts

## Support

For issues or questions:
- Check the main README: `scripts/README.md`
- Review logs: `docker-compose logs -f` or console output
- Test connectivity: `curl http://localhost:36657/status`
- Verify configuration: `npm test`
