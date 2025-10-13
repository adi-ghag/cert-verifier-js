import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { HashlinkVerifier } from '@blockcerts/hashlink-verifier';
import Verifier from '../../../src/verifier';
import { universalResolverUrl } from '../../../src/domain/did/valueObjects/didResolver';
import didDocument from '../../fixtures/did/did:ion:EiA_Z6LQILbB2zj_eVrqfQ2xDm4HNqeJUw5Kj2Z7bFOOeQ.json';
import v3RevocationList from '../../assertions/v3-revocation-list';
import BlockcertsStatusList2021 from '../../fixtures/blockcerts-status-list-2021.json';
import fixtureBlockcertsIssuerProfile from '../../fixtures/issuer-blockcerts.json';
import fixtureMainnetIssuerProfile from '../../fixtures/issuer-profile-mainnet-example.json';
import fixtureMainnetRevocationList from '../../fixtures/revocation-list-mainnet-example.json';
import StatusList2021Revoked from '../../fixtures/v3/cert-rl-status-list-2021-revoked.json';
import StatusList2021 from '../../fixtures/v3/cert-rl-status-list-2021.json';
import MainnetV2Revoked from '../../fixtures/v2/mainnet-revoked-2.0.json';
import BlockcertsV3VerificationMethodIssuerProfile from '../../fixtures/v3/testnet-v3-verification-method-issuer-profile.json';

describe('Verifier checkRevokedStatus method test suite', function () {
  beforeAll(function () {
    vi.mock('@adityaghag/explorer-lookup', async (importOriginal) => {
      const explorerLookup = await importOriginal();
      return {
        ...explorerLookup,
        // replace some exports
        request: async function ({ url }) {
          if (url === `${universalResolverUrl}/did:ion:EiA_Z6LQILbB2zj_eVrqfQ2xDm4HNqeJUw5Kj2Z7bFOOeQ`) {
            return JSON.stringify({ didDocument });
          }

          if (url === 'https://www.blockcerts.org/samples/3.0/issuer-blockcerts.json') {
            return JSON.stringify(fixtureBlockcertsIssuerProfile);
          }

          if (url === 'https://www.blockcerts.org/samples/3.0/revocation-list-blockcerts.json?assertionId=urn%3Auuid%3Abbba8553-8ec1-445f-82c9-a57251dd731c') {
            return JSON.stringify(v3RevocationList);
          }

          if (url === 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e.json') {
            return JSON.stringify(fixtureMainnetIssuerProfile);
          }

          if (url === 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e/revocation.json?assertionId=https%3A%2F%2Fblockcerts.learningmachine.com%2Fcertificate%2Fc4e09dfafc4a53e8a7f630df7349fd39') {
            return JSON.stringify(fixtureMainnetRevocationList);
          }

          if (url === 'https://www.blockcerts.org/samples/3.0/status-list-2021.json') {
            return JSON.stringify(BlockcertsStatusList2021);
          }
        }
      };
    });
  });

  afterAll(function () {
    vi.restoreAllMocks();
  });

  describe('given the revocation of the certificate is handled by the legacy (Blockcerts) approach', function () {
    describe('and the certificate is revoked', function () {
      it('should record the verification step failure', async function () {
        const fixture = MainnetV2Revoked;
        const verifier = new Verifier({
          certificateJson: fixture,
          expires: '',
          id: fixture.id,
          issuer: fixture.badge.issuer,
          revocationKey: null,
          explorerAPIs: undefined,
          hashlinkVerifier: new HashlinkVerifier()
        });
        await verifier.init();
        await (verifier as any).checkRevokedStatus(); // private method
        expect((verifier as any)._stepsStatuses).toEqual([{
          code: 'checkRevokedStatus',
          message: 'This certificate has been revoked by the issuer. Reason given: Incorrect Issue Date. New credential to be issued.',
          status: 'failure'
        }]);
      });
    });

    describe('and the certificate is not revoked', function () {
      it('should record the verification step success', async function () {
        const fixture = BlockcertsV3VerificationMethodIssuerProfile;
        const verifier = new Verifier({
          certificateJson: fixture,
          expires: '',
          id: fixture.id,
          issuer: fixtureBlockcertsIssuerProfile,
          revocationKey: null,
          explorerAPIs: undefined,
          hashlinkVerifier: new HashlinkVerifier()
        });
        await verifier.init();
        await (verifier as any).checkRevokedStatus(); // private method
        expect((verifier as any)._stepsStatuses).toEqual([{
          code: 'checkRevokedStatus',
          status: 'success'
        }]);
      });
    });
  });

  describe('given the revocation of the certificate is a W3C StatusList2021', function () {
    describe('and the certificate is not revoked', function () {
      it('should record the verification step success', async function () {
        const fixture = StatusList2021;
        const verifier = new Verifier({
          certificateJson: fixture,
          expires: '',
          id: fixture.id,
          issuer: fixtureBlockcertsIssuerProfile,
          revocationKey: null,
          explorerAPIs: undefined,
          hashlinkVerifier: new HashlinkVerifier()
        });
        await verifier.init();
        await (verifier as any).checkRevokedStatus(); // private method
        expect((verifier as any)._stepsStatuses).toEqual([{
          code: 'checkRevokedStatus',
          status: 'success'
        }]);
      });
    });

    describe('and the certificate is revoked', function () {
      it('should record the verification step failure', async function () {
        const fixture = StatusList2021Revoked;
        const verifier = new Verifier({
          certificateJson: fixture,
          expires: '',
          id: fixture.id,
          issuer: fixtureBlockcertsIssuerProfile,
          revocationKey: null,
          explorerAPIs: undefined,
          hashlinkVerifier: new HashlinkVerifier()
        });
        await verifier.init();
        await (verifier as any).checkRevokedStatus(); // private method
        expect((verifier as any)._stepsStatuses).toEqual([{
          code: 'checkRevokedStatus',
          message: 'This certificate has been revoked by the issuer.',
          status: 'failure'
        }]);
      });
    });
  });
});
