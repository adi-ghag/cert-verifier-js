# Blockchain Support in cert-verifier-js

This document describes the blockchain networks supported by cert-verifier-js for Blockcerts verification.

## Supported Blockchains

### Bitcoin Networks
- **Bitcoin Mainnet** (`bitcoin`) - Production Bitcoin network
- **Bitcoin Testnet** (`testnet`) - Bitcoin test network
- **Bitcoin Regtest** (`regtest`) - Bitcoin regression test network (mocknet)

### Ethereum Networks
- **Ethereum Mainnet** (`ethmain`) - Production Ethereum network
- **Ethereum Ropsten** (`ethropst`) - Deprecated Ethereum testnet
- **Ethereum Rinkeby** (`ethrinkeby`) - Deprecated Ethereum testnet
- **Ethereum Goerli** (`ethgoerli`) - Ethereum testnet
- **Ethereum Sepolia** (`ethsepolia`) - Current Ethereum testnet

### Arbitrum Networks (NEW)
- **Arbitrum One** (`arbitrumone`) - Arbitrum Layer 2 mainnet
  - Explorer: https://arbiscan.io
  - RPC Endpoint: https://arb1.arbitrum.io/rpc
  - Chain ID: 42161
  - Signature Value: `arbitrumOne`

- **Arbitrum Sepolia** (`arbitrumsepolia`) - Arbitrum testnet
  - Explorer: https://sepolia.arbiscan.io
  - RPC Endpoint: https://sepolia-rollup.arbitrum.io/rpc
  - Chain ID: 421614
  - Signature Value: `arbitrumSepolia`

### Research Networks (NEW)
- **bloxberg** (`ethbloxberg`) - Academic/research blockchain network
  - Explorer: https://blockexplorer.bloxberg.org
  - Blockscout API: https://blockexplorer.bloxberg.org/api
  - Signature Value: `ethbloxberg`
  - Used by academic institutions for research data verification

### Mock Networks
- **Mocknet** (`mocknet`) - Testing/development network

## Implementation Details

### Chain Detection

Chains are identified by their `signatureValue` property in the Blockcerts credential's proof section. The library maps these values to blockchain configurations:

```javascript
import { BLOCKCHAINS, SupportedChains } from '@adityaghag/explorer-lookup';

// Access chain configuration
const bloxberg = BLOCKCHAINS[SupportedChains.Ethbloxberg];
const arbitrumOne = BLOCKCHAINS[SupportedChains.ArbitrumOne];
```

### Verification Process

For blockchain-anchored certificates (MerkleProof2019/2017):

1. **Transaction Lookup**: The library queries blockchain explorers to retrieve the transaction data
2. **Hash Comparison**: Compares the hash embedded in the blockchain with the computed certificate hash
3. **Issuer Verification**: Validates the issuing address matches the credential issuer

### Explorer APIs

#### Bloxberg
- Uses Blockscout API
- Supports smart contract ABI decoding for merkle root extraction
- API Endpoint: `https://blockexplorer.bloxberg.org/api?module=transaction&action=gettxinfo&txhash={hash}`

#### Arbitrum Networks
- Primary: Arbiscan explorers (Etherscan-compatible)
- Fallback: Public RPC endpoints for direct chain queries
- Supports both mainnet and testnet environments

## Creating Blockcerts for New Chains

### For Bloxberg

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/blockcerts/v3"
  ],
  "type": ["VerifiableCredential", "BlockcertsCredential"],
  "issuer": "did:example:issuer",
  "issuanceDate": "2024-01-01T00:00:00Z",
  "credentialSubject": { ... },
  "proof": {
    "type": "MerkleProof2019",
    "created": "2024-01-01T00:00:00Z",
    "proofValue": "...",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "...",
    "anchors": [{
      "chain": "ethbloxberg",
      "transactionId": "0x..."
    }]
  }
}
```

### For Arbitrum One (Mainnet)

```json
{
  "proof": {
    "type": "MerkleProof2019",
    ...
    "anchors": [{
      "chain": "arbitrumone",
      "transactionId": "0x..."
    }]
  }
}
```

### For Arbitrum Sepolia (Testnet)

```json
{
  "proof": {
    "type": "MerkleProof2019",
    ...
    "anchors": [{
      "chain": "arbitrumsepolia",
      "transactionId": "0x..."
    }]
  }
}
```

## Technical Architecture

### Dependencies

The blockchain support is implemented across two packages:

1. **@adityaghag/explorer-lookup** (v1.2.1)
   - Contains blockchain definitions and explorer APIs
   - Handles transaction lookups and data parsing
   - Provides RPC support for direct chain queries

2. **@adityaghag/jsonld-signatures-merkleproof2019** (v1.2.2)
   - Implements MerkleProof2019 signature verification
   - Integrates with explorer-lookup for chain interactions
   - Supports multiple signature types and proof formats

### Chain Configuration

Each blockchain is defined with:
- **code**: Internal identifier (enum value)
- **name**: Human-readable name
- **signatureValue**: Value used in Blockcerts proofs
- **prefixes**: Address/hash prefixes for the chain
- **test**: Boolean flag indicating testnet status
- **transactionTemplates**: URLs for transaction explorer links

### Explorer Priority

The verification process uses a fallback system:
1. Custom explorer APIs (if provided)
2. Default explorer APIs (Arbiscan, Blockscout, etc.)
3. Public RPC endpoints (for Arbitrum chains)

## Testing

To verify chain support:

```bash
# Run all tests
npm test

# Test specific chain integration
node test-new-chains.mjs
```

## Custom Explorer Configuration

You can provide custom explorer APIs when instantiating certificates:

```javascript
import { Certificate } from '@blockcerts/cert-verifier-js';

const certificate = new Certificate(certificateData, {
  explorerAPIs: [{
    serviceURL: 'https://custom-explorer.com/api',
    serviceName: 'blockscout',
    priority: 0,  // Run before default explorers
    parsingFunction: customParsingFunction
  }]
});
```

## Future Support

Additional chains can be added by:
1. Defining the chain in `@adityaghag/explorer-lookup/src/constants/blockchains.ts`
2. Adding the chain code to `SupportedChains` enum
3. Implementing explorer API support (if needed)
4. Adding RPC endpoint configuration (for EVM chains)

## References

- [Blockcerts Specification](https://www.blockcerts.org/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [MerkleProof2019 Specification](https://w3c-ccg.github.io/lds-merkleproof2019/)
- [bloxberg Network](https://bloxberg.org/)
- [Arbitrum Documentation](https://docs.arbitrum.io/)
