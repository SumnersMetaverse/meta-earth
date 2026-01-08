# IoTeX Network Integration

## Overview

This document describes the IoTeX network integration in the me-chain project. The integration adds support for IoTeX mainnet RPC configuration, enabling seamless interaction with the IoTeX blockchain network.

## Configuration

The IoTeX network configuration is automatically included in the `app.toml` file when you initialize a new node.

### Configuration Fields

The IoTeX configuration section includes the following fields:

- **chain-id**: The IoTeX mainnet chain ID (4689)
- **rpc-urls**: A list of RPC endpoints for connecting to the IoTeX network

### Default Configuration

When you initialize a node, the following default IoTeX configuration is automatically added to your `app.toml` file:

```toml
###############################################################################
###                          IoTeX Network Configuration                   ###
###############################################################################

[iotex]

# ChainID is the IoTeX mainnet chain ID
chain-id = 4689

# RPCURLs is a list of RPC endpoints for IoTeX network
rpc-urls = ["https://babel-api.mainnet.iotex.io", "https://rpc.ankr.com/iotex"]
```

## Usage

### Initializing a Node

When you initialize a new node using the `me-chaind init` command, the IoTeX configuration will be automatically added to your `~/.me-chain/config/app.toml` file:

```bash
me-chaind init <moniker> --chain-id <your-chain-id>
```

### Modifying Configuration

You can modify the IoTeX configuration by editing the `[iotex]` section in your `app.toml` file. For example, you can:

1. Change the RPC endpoints
2. Add additional RPC URLs
3. Modify the chain ID (if connecting to a testnet)

### Accessing Configuration

The IoTeX configuration can be accessed programmatically through the application's configuration system:

```go
import (
    "github.com/spf13/viper"
)

// Access IoTeX chain ID
chainID := viper.GetInt64("iotex.chain-id")

// Access RPC URLs
rpcURLs := viper.GetStringSlice("iotex.rpc-urls")
```

## IoTeX Network Details

### Mainnet

- **Chain ID**: 4689
- **Network**: IoTeX Mainnet
- **RPC Endpoints**:
  - Primary: https://babel-api.mainnet.iotex.io
  - Secondary: https://rpc.ankr.com/iotex

### Additional Resources

- [IoTeX Official Website](https://iotex.io/)
- [IoTeX Documentation](https://docs.iotex.io/)
- [IoTeX Developer Portal](https://developers.iotex.io/)

## Integration with Cosmos SDK

The IoTeX configuration follows the same pattern as other custom configurations in the Cosmos SDK:

1. Configuration structure is defined with `mapstructure` tags
2. Default configuration function provides sensible defaults
3. Configuration template generates the TOML format
4. Configuration is embedded in the CustomAppConfig structure

This ensures compatibility with existing Cosmos SDK tooling and configuration management.

## Testing

Tests are provided to verify the IoTeX configuration:

```bash
# Run tests for the root command
go test ./cmd/me-chaind/cmd/...
```

The tests verify:
- Default configuration values are correct
- Chain ID is set to 4689
- RPC URLs are properly configured
- Configuration template is properly formatted

## Security Considerations

When using the IoTeX RPC endpoints:

1. **RPC Endpoint Selection**: The default configuration includes multiple RPC endpoints for redundancy. If one endpoint is unavailable, you can use the other.

2. **HTTPS**: All default RPC URLs use HTTPS for secure communication.

3. **Custom Endpoints**: If you're running your own IoTeX node, you can add your custom RPC endpoint to the configuration.

## Troubleshooting

### Configuration Not Loading

If the IoTeX configuration is not appearing in your `app.toml`:

1. Ensure you're using the latest version of `me-chaind`
2. Try reinitializing your node configuration
3. Check that the `app.toml` file has the correct permissions

### RPC Connection Issues

If you're experiencing issues connecting to IoTeX RPC endpoints:

1. Verify your internet connection
2. Check if the RPC endpoints are accessible from your network
3. Try using alternative RPC endpoints
4. Consider running your own IoTeX node for improved reliability
