# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@blockcerts/cert-verifier-js`, a JavaScript/TypeScript library for parsing and verifying Blockcerts certificates. It supports multiple blockchain and W3C standards for verifiable credentials, including:
- Blockcerts v2 and v3 (v1 is deprecated)
- W3C Verifiable Credentials v1 and v2
- Data Integrity proofs
- Multiple cryptographic suites (MerkleProof2017/2019, Ed25519Signature2020, EcdsaSecp256k1Signature2019, EcdsaSd2023, EddsaRdfc2022)

The library runs in browser, Node.js, and ESM environments.

### Supported Blockchains

**This package uses custom forks with extended blockchain support:**
- `@adityaghag/explorer-lookup` v1.2.1 (fork of @blockcerts/explorer-lookup)
- `@adityaghag/jsonld-signatures-merkleproof2019` v1.2.2 (fork of jsonld-signatures-merkleproof2019)

**Supported chains include:**
- Bitcoin: Mainnet, Testnet, Regtest
- Ethereum: Mainnet, Ropsten, Rinkeby, Goerli, Sepolia
- **Arbitrum: Arbitrum One (mainnet), Arbitrum Sepolia (testnet)** ✨ NEW
- **bloxberg: Academic/research blockchain network** ✨ NEW
- Mocknet: Testing/development

See `BLOCKCHAIN_SUPPORT.md` for detailed information about blockchain support and usage.

## Common Commands

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run build tests (tests the compiled output in different module formats)
npm run test:build
# Individual build tests:
npm run test:build:node    # Node.js build
npm run test:build:cjs     # CommonJS build
npm run test:build:esm     # ES Module build
npm run test:build:iife    # Browser/IIFE build (uses Karma)
```

### Building
```bash
# Full build (includes transpilation, bundling, type definitions, and build tests)
npm run build

# Individual builds:
npm run build:esm   # ES modules (default export)
npm run build:iife  # Browser bundle
npm run build:node  # Node.js specific build

# Generate TypeScript declaration bundle
npm run dts:bundle
```

### Linting
```bash
# Run ESLint
npm run lint
```

### Manual Testing
```bash
# Browser testing (opens HTML page with test fixtures)
npm run test:manual:browser

# Node.js testing (requires two terminals):
# Terminal 1: Start test server
npm run test:manual:node:server
# Terminal 2: Make verification request
npm run test:manual:node:verify
```

## Architecture

### Core Entry Points

- **src/index.ts**: Main library exports (Certificate class, constants, utilities)
- **src/certificate.ts**: Certificate class - main API for parsing and verifying certificates
- **src/verifier.ts**: Verifier class - handles verification orchestration and step management

### Multi-Format Builds

The library provides three build outputs for different environments:
- **CommonJS** (`dist/verifier/index.js`): Default Node.js/require() entry point
- **ES Modules** (`dist/verifier-es/index.js`): Modern import/export entry point
- **Node.js specific** (`dist/verifier-node/index.js`): Node.js optimized build with Node-specific polyfills
- **IIFE** (`dist/verifier-iife.js`): Browser `<script>` tag bundle (exposes global `Verifier` object)

### Domain-Driven Structure

The `src/domain/` directory follows domain-driven design with bounded contexts:

- **addresses/**: Blockchain address validation (mainnet/testnet detection)
- **certificates/**: Certificate data extraction (transaction IDs, chain info, metadata)
- **chains/**: Blockchain-related logic (mock chain detection)
- **did/**: DID resolution and verification (W3C DID standard support)
- **i18n/**: Internationalization (translations for verification steps and errors)
- **verifier/**: Core verification logic
  - `entities/verificationSteps.ts`: Verification step definitions (constants for all verification substeps)
  - `useCases/`: Individual verification operations
  - `valueObjects/VerificationSubstep.ts`: Verification step data structures

Each domain exports useCases and follows a consistent pattern: `domain/<context>/useCases/<operation>.ts`

### Verification Suites (Cryptographic Proofs)

`src/suites/` contains verification suite implementations for different cryptographic signature types. Each suite:
- Extends a common interface (SuiteAPI)
- Implements proof verification (verifyProof method)
- Implements identity verification (verifyIdentity method)
- Provides verification substeps for progress tracking

Available suites:
- **MerkleProof2017.ts**: Legacy Blockcerts v2 (blockchain-anchored)
- **MerkleProof2019.ts**: Modern Blockcerts v3 (blockchain-anchored)
- **Ed25519Signature2020.ts**: W3C DID-based Ed25519 signatures
- **EcdsaSecp256k1Signature2019.ts**: ECDSA signatures with secp256k1 curve
- **EcdsaSd2023.ts**: ECDSA with selective disclosure
- **EddsaRdfc2022.ts**: EdDSA with RDF canonicalization

Suites are **dynamically loaded** based on the certificate's proof type to minimize bundle size.

### Verification Process

The verification flow:
1. **Certificate instantiation**: Parse certificate JSON, detect version/format
2. **init()**: Async initialization - loads hashlink verifier if needed, instantiates Verifier
3. **verify(callback)**: Execute verification
   - Instantiate appropriate proof verifier suite(s)
   - Run verification substeps (format validation, proof verification, identity verification, revocation checks, expiration checks, etc.)
   - Execute callback for each substep with status updates
   - Return final verification status

**Key principle**: Verification is step-based with granular progress reporting. Each substep can succeed/fail independently and reports status via callback.

### Verifiable Presentations

The library supports W3C Verifiable Presentations (VP) - containers holding multiple Verifiable Credentials. When a VP is detected:
- Each credential is instantiated as a separate Certificate instance
- Verification runs on each credential independently
- Overall VP verification fails if any credential fails

### Type Definitions

TypeScript declarations are generated and bundled into `dist/index.d.ts` via `dts-bundle-generator`. The codebase uses TypeScript with loose settings:
- `noImplicitAny: false` - allows implicit any
- `allowJs: true` - JavaScript files allowed
- Module resolution: Node

### Testing Structure

- **test/application/**: Domain logic unit tests (verification steps, certificate parsing)
- **test/assertions/**: Custom test assertions
- **test/contract/**: API contract tests
- **test/fixtures/**: Test certificate data (v2, v3, various proof types)
- **test/e2e/**: End-to-end integration tests
- **test/build/**: Build output verification tests (ensures each build format works correctly)
- **test/manual-testing/**: Manual test harnesses for browser and Node.js environments

Tests use **Vitest** as the test runner. Build tests use separate Vitest configs for each module format. Browser IIFE tests use **Karma** with Jasmine.

### Explorer APIs

The library supports custom blockchain explorer APIs for transaction lookup (see explorerAPIs option). Users can:
- Override default explorers
- Provide API keys for rate-limited services
- Set priority (custom explorers can run before/after defaults)
- Implement custom parsing functions to transform API responses

Default explorers are defined in `src/constants/api.ts`.

### Rollup Configuration

Three Rollup configs handle different build targets:
- **rollup.config.mjs**: ES Module build
- **rollup.iife.config.mjs**: Browser IIFE bundle (includes polyfills for Node.js globals)
- **rollup.node.config.mjs**: Node.js optimized build

All configs use TypeScript plugin, commonjs plugin, and node-resolve plugin. The IIFE build additionally includes node-globals and node-builtins polyfills for browser compatibility.

## Important Patterns

### Certificate Lifecycle
Always call `await certificate.init()` after instantiation before using the certificate. The constructor is synchronous but init() performs async setup (hashlink verification, proof suite loading).

### Proof Purpose, Domain, and Challenge
For authentication use cases, certificates can be verified with specific constraints:
- `proofPurpose`: Restricts verification to a specific purpose (e.g., "authentication")
- `domain`: Restricts to specific domain(s) matching the proof's domain property
- `challenge`: Must match the challenge in the proof (prevents replay attacks)

These are passed via CertificateOptions to the Certificate constructor.

### Verification Substeps
Verification progress is tracked via substeps. Each substep has:
- `code`: Unique identifier (from SUB_STEPS constants)
- `label`: Human-readable description
- `labelPending`: Present-tense label shown during execution
- `parentStep`: Parent verification step (from VerificationSteps enum)
- `status`: success/failure/starting

### Error Handling
Verification errors are thrown as VerifierError instances with a step code and message. All errors are caught by the executeStep wrapper and reported via callback.

### Internationalization
All user-facing strings go through the i18n system (`domain.i18n.getText()`). Supported languages are defined in `src/data/i18n.json`. Use `getSupportedLanguages()` to get available locale codes.

### Semantic Release
This project uses semantic-release for automated versioning and publishing. Commits must follow conventional commit format. The version in package.json is always `0.0.0-dev` (semantic-release updates it on release).

## Key Constraints

- **Node.js compatibility**: The library must work in Node.js, browsers, and ES module environments
- **No v1 Blockcerts support**: v1 certificates are explicitly not supported (use the legacy library)
- **Async initialization required**: Certificate and Verifier classes require async init() after construction
- **Dynamic suite loading**: Verification suites are imported dynamically to reduce bundle size
- **Immutable certificate JSON**: The original certificate JSON is deep-copied to prevent mutation

## Build Output Testing

The `npm run build` command includes automatic build verification (`test:build`). This ensures each module format (CJS, ESM, Node, IIFE) works correctly by running actual import/require tests against the built files. These tests catch issues like missing dependencies, incorrect module resolution, or broken polyfills.
