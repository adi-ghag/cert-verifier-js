import { describe, it, expect, vi } from 'vitest';
import { Certificate, VERIFICATION_STATUSES } from '../../../src';
import MocknetVCV2DataIntegrityProofMultipleSignaturesNonChained from '../../fixtures/v3/mocknet-vc-v2-data-integrity-proof-multiple-signatures-non-chained.json';
import fixtureBlockcertsIssuerProfile from '../../fixtures/issuer-blockcerts.json';
import fixtureCredentialSchema from '../../fixtures/credential-schema-example-id-card.json';

describe('given the certificate is signed with multiple non chained DataIntegrityProof Merkle Proof 2019', function () {
  it('should be a valid verification', async function () {
    vi.mock('@adityaghag/explorer-lookup', async (importOriginal) => {
      const explorerLookup = await importOriginal();
      return {
        ...explorerLookup,
        request: async function ({ url }) {
          if (url === 'https://www.blockcerts.org/samples/3.0/issuer-blockcerts.json') {
            return JSON.stringify(fixtureBlockcertsIssuerProfile);
          }

          if (url === 'https://www.blockcerts.org/samples/3.0/example-id-card-schema.json') {
            return JSON.stringify(fixtureCredentialSchema);
          }
        }
      };
    });
    const certificate = new Certificate(MocknetVCV2DataIntegrityProofMultipleSignaturesNonChained);
    await certificate.init();
    const result = await certificate.verify();
    expect(result.status).toBe(VERIFICATION_STATUSES.SUCCESS);
    vi.restoreAllMocks();
  });
});
