# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm test` - Run all tests using Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint on TypeScript files
- `npm run build` - Full build (ESM, IIFE, Node.js versions + type definitions + tests)
- `npm run build:esm` - Build ES modules version
- `npm run build:iife` - Build browser IIFE version
- `npm run build:node` - Build Node.js version

### Testing Build Output
- `npm run test:build` - Test all build outputs (requires manual server)
- `npm run test:manual:node:server` - Start test server for Node.js testing
- `npm run test:manual:node:verify` - Run Node.js verification test
- `npm run test:manual:browser` - Build browser test page

### Single Test Execution
Run specific test files with: `npx vitest run <test-file-path>`

## Architecture

### Core Structure
This is a TypeScript library for parsing and verifying Blockcerts certificates. The main entry point exports a `Certificate` class that handles asynchronous certificate initialization and verification.

### Key Architectural Patterns

**Domain-Driven Design**: Code is organized in domain folders under `src/domain/`:
- `certificates/` - Certificate-related business logic
- `verifier/` - Verification process management
- `chains/` - Blockchain interaction logic
- `did/` - DID resolution functionality
- `i18n/` - Internationalization support

**Models Layer**: `src/models/` contains TypeScript interfaces and types for:
- Certificate versions (V1, V2, V3)
- Blockchain data structures
- Verification results
- DID documents

**Inspector Pattern**: `src/inspectors/` contains validation functions that follow a consistent pattern for certificate verification steps.

**Multi-Target Builds**: The library builds to multiple targets:
- ESM (`dist/verifier-es/`) - ES modules for modern environments
- IIFE (`dist/verifier-iife.js`) - Browser script tag usage
- Node.js (`dist/verifier-node/`) - CommonJS for Node.js
- TypeScript definitions (`dist/index.d.ts`)

### Certificate Initialization
From v4+, Certificate instantiation is asynchronous:
```javascript
const certificate = new Certificate(definition, options);
await certificate.init(); // Required before use
```

### Verification Process
The verification system uses a step-based approach with real-time status callbacks. Each verification step is defined in `src/domain/verifier/entities/verificationSteps.ts` and uses the inspector pattern for validation.

### Testing Strategy
- Unit tests in `test/application/` mirror the `src/` structure
- Build tests in `test/build/` verify all target outputs
- Manual testing available for both browser and Node.js environments
- Uses Vitest as the test runner

### Key Dependencies
- **Blockchain explorers**: Custom explorer APIs supported via `explorerAPIs` option
- **DID resolution**: Configurable DID resolver URL support
- **Signature suites**: Multiple cryptographic signature support including Ed25519, secp256k1
- **Internationalization**: Multi-language support with auto-detection

The codebase emphasizes modularity, type safety, and support for multiple certificate versions and blockchain networks.