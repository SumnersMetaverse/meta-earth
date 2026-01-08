package cmd

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestDefaultIoTeXConfig verifies the default IoTeX configuration
func TestDefaultIoTeXConfig(t *testing.T) {
	config := DefaultIoTeXConfig()

	// Verify Chain ID is set to IoTeX mainnet
	require.Equal(t, int64(4689), config.ChainID, "IoTeX Chain ID should be 4689")

	// Verify RPC URLs are configured
	require.NotEmpty(t, config.RPCURLs, "RPC URLs should not be empty")
	require.Len(t, config.RPCURLs, 2, "Should have exactly 2 RPC URLs")

	// Verify the specific RPC URLs
	require.Contains(t, config.RPCURLs, "https://babel-api.mainnet.iotex.io", "Should contain babel-api RPC URL")
	require.Contains(t, config.RPCURLs, "https://rpc.ankr.com/iotex", "Should contain ankr RPC URL")
}

// TestIoTeXConfigStruct verifies the IoTeX configuration structure
func TestIoTeXConfigStruct(t *testing.T) {
	config := IoTeXConfig{
		ChainID: 4689,
		RPCURLs: []string{
			"https://babel-api.mainnet.iotex.io",
			"https://rpc.ankr.com/iotex",
		},
	}

	require.Equal(t, int64(4689), config.ChainID)
	require.Equal(t, 2, len(config.RPCURLs))
}

// TestInitAppConfig verifies that initAppConfig includes IoTeX configuration
func TestInitAppConfig(t *testing.T) {
	template, config := initAppConfig()

	// Verify template contains IoTeX configuration section
	require.Contains(t, template, "IoTeX Network Configuration", "Template should contain IoTeX configuration header")
	require.Contains(t, template, "[iotex]", "Template should contain [iotex] section")
	require.Contains(t, template, "chain-id", "Template should contain chain-id field")
	require.Contains(t, template, "rpc-urls", "Template should contain rpc-urls field")

	// Verify config is not nil
	require.NotNil(t, config, "Config should not be nil")
}
