# Meta Earth Transaction Forwarder

A CosmJS-based transaction forwarding service for the Meta Earth blockchain network. This service securely handles token transfers using Docker secrets for wallet management.

## Features

- ✅ CosmJS integration with Meta Earth chain
- ✅ Docker secrets support for secure mnemonic storage
- ✅ RESTful API for transaction operations
- ✅ Automatic connection to Meta Earth RPC nodes
- ✅ Configurable gas prices and limits
- ✅ Health check and monitoring endpoints

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Access to a Meta Earth RPC endpoint (default: http://localhost:26657)
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Development

1. Navigate to the scripts directory:
```bash
cd scripts
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and set your configuration:
   - `ME_CHAIN_ID`: Meta Earth chain ID (default: `mechain_100-1`)
   - `ME_RPC_ENDPOINT`: RPC endpoint URL
   - `ME_FORWARD_DEST`: Destination address for forwarded tokens
   - `ME_SIGNER_MNEMONIC`: Your 24-word mnemonic phrase (⚠️ Keep secure!)

5. Start the service:
```bash
npm start
```

### Docker Deployment (Recommended for Production)

Docker deployment uses Docker secrets to securely manage your wallet mnemonic.

1. Create secrets directory:
```bash
mkdir -p scripts/secrets
```

2. Store your mnemonic in a secret file:
```bash
echo "your 24-word mnemonic phrase here" > scripts/secrets/me_signer_mnemonic.txt
chmod 600 scripts/secrets/me_signer_mnemonic.txt
```

3. Configure environment variables in `docker-compose.yml` or create a `.env` file

4. Start the service with Docker Compose:
```bash
cd scripts
docker-compose up -d
```

5. View logs:
```bash
docker-compose logs -f metaearth-forwarder
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ME_CHAIN_ID` | Meta Earth chain ID | `mechain_100-1` | No |
| `ME_RPC_ENDPOINT` | RPC endpoint URL | `http://localhost:26657` | No |
| `ME_FEE_DENOM` | Fee denomination | `umec` | No |
| `ME_ADDRESS_PREFIX` | Bech32 address prefix | `me` | No |
| `ME_FORWARD_DEST` | Destination address for forwarded tokens | - | ✅ Yes |
| `ME_SIGNER_MNEMONIC` | 24-word mnemonic (if not using Docker secrets) | - | ✅ Yes* |
| `ME_DOCKER_SECRET_PATH` | Path to Docker secret file | `/run/secrets/me_signer_mnemonic` | No |
| `ME_TX_MEMO` | Default transaction memo | `""` | No |
| `ME_GAS_PRICE` | Gas price in fee denom | `0.025` | No |
| `ME_GAS_LIMIT` | Gas limit per transaction | `150000` | No |
| `PORT` | HTTP server port | `3000` | No |

*Either `ME_SIGNER_MNEMONIC` or a Docker secret must be provided.

### Meta Earth Chain Details

Based on the Meta Earth repository configuration:

- **Chain ID**: `mechain_100-1` (from `readme.md`)
- **Native Denom**: `umec` (from `config.yml`)
- **Address Prefix**: `me` (bech32)
- **Default RPC Port**: `26657`

For local development, you can run a local Meta Earth node using:
```bash
# From the repository root
bash scripts/setup_local.sh
med start
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "chainId": "mechain_100-1",
  "signerAddress": "me1...",
  "connected": true
}
```

### GET /address
Get the signer address.

**Response:**
```json
{
  "address": "me1..."
}
```

### POST /forward
Forward tokens to the configured destination address.

**Request Body:**
```json
{
  "amount": "12345",
  "denom": "umec",
  "memo": "Custom memo" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "height": 12345,
  "transactionHash": "ABC123...",
  "gasUsed": 125000,
  "gasWanted": 150000,
  "rawLog": "..."
}
```

### GET /balance/:address
Get account balance for any address.

**Response:**
```json
{
  "address": "me1...",
  "balances": [
    {
      "denom": "umec",
      "amount": "1000000"
    }
  ]
}
```

## Usage Examples

### Using curl

Forward 10 MEC tokens:
```bash
curl -X POST http://localhost:3000/forward \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10000000",
    "denom": "umec",
    "memo": "Test forward"
  }'
```

Check signer address:
```bash
curl http://localhost:3000/address
```

Check balance:
```bash
curl http://localhost:3000/balance/me1youraddresshere
```

### Using JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/forward', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: '10000000',
    denom: 'umec',
    memo: 'Automated forward',
  }),
});

const result = await response.json();
console.log('Transaction hash:', result.transactionHash);
```

## Security Best Practices

### ⚠️ Critical Security Guidelines

1. **Never commit mnemonics to version control**
   - Add `.env` to `.gitignore`
   - Use Docker secrets in production
   - Rotate keys regularly

2. **Use Docker secrets for production**
   ```bash
   # Store mnemonic securely
   echo "your mnemonic" | docker secret create me_signer_mnemonic -
   ```

3. **Restrict network access**
   - Use firewall rules to limit access to the service
   - Consider using API authentication (add middleware as needed)
   - Use HTTPS in production with a reverse proxy

4. **Monitor and log**
   - Set up log aggregation
   - Monitor for unusual transaction patterns
   - Set up alerts for failed transactions

5. **Wallet security**
   - Use a dedicated wallet for the forwarder
   - Keep only necessary funds in the wallet
   - Regularly audit transaction history

## Troubleshooting

### Connection Issues

**Error: "Failed to connect to RPC endpoint"**
- Verify the Meta Earth node is running: `med status`
- Check the RPC endpoint is accessible: `curl http://localhost:26657/status`
- Verify the `ME_RPC_ENDPOINT` is correct

**Error: "Chain ID mismatch"**
- Ensure `ME_CHAIN_ID` matches your node's chain ID
- Check with: `med status | jq .NodeInfo.network`

### Authentication Issues

**Error: "Mnemonic not configured"**
- Verify `ME_SIGNER_MNEMONIC` is set in `.env`
- Or ensure Docker secret is properly mounted
- Check file permissions on secret file (should be readable)

### Transaction Failures

**Error: "Insufficient funds"**
- Check signer wallet balance: `med query bank balances $(med keys show hub-user -a)`
- Ensure wallet has enough `umec` for gas fees

**Error: "Forward destination address not configured"**
- Set `ME_FORWARD_DEST` in your `.env` file

## Integration with Meta Earth Repository

This forwarder is designed to work with the Meta Earth blockchain:

1. **Chain Configuration**: Automatically uses Meta Earth chain defaults (`mechain_100-1`, `umec` denom)
2. **RPC Connectivity**: Connects to Meta Earth RPC nodes (local or remote)
3. **Cosmos SDK**: Compatible with Meta Earth's Cosmos SDK-based chain
4. **Key Management**: Works with Meta Earth key formats and prefixes

### Running with Local Meta Earth Node

```bash
# Terminal 1: Start Meta Earth node
cd /path/to/meta-earth
bash scripts/setup_local.sh
med start

# Terminal 2: Start forwarder
cd scripts
npm start
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses Node.js watch mode to automatically restart on file changes.

### Testing

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Test with a small transaction:
```bash
curl -X POST http://localhost:3000/forward \
  -H "Content-Type: application/json" \
  -d '{"amount": "1", "denom": "umec"}'
```

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Meta Earth documentation: See main repository README
3. Create an issue in the repository
