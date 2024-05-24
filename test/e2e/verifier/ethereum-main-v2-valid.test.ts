import { describe, it, expect, vi } from 'vitest';
import { Certificate, VERIFICATION_STATUSES } from '../../../src';
import EthereumMainV2Valid from '../../fixtures/v2/ethereum-main-valid-2.0.json';

describe('given the certificate is a valid ethereum main', function () {
  it('should verify successfully', async function () {
    vi.mock('@blockcerts/explorer-lookup', async (importOriginal) => {
      const explorerLookup = await importOriginal();
      return {
        ...explorerLookup,
        request: async function ({ url }) {
          if (url === 'https://raw.githubusercontent.com/AnthonyRonning/https-github.com-labnol-files/master/issuer-eth-mainnet.json?raw=true') {
            return JSON.stringify({
              '@context': [
                'https://w3id.org/openbadges/v2',
                'https://w3id.org/blockcerts/3.0'
              ],
              type: 'Profile',
              id: 'https://raw.githubusercontent.com/AnthonyRonning/https-github.com-labnol-files/master/issuer-eth-mainnet.json?raw=true',
              publicKey: [
                {
                  id: 'ecdsa-koblitz-pubkey:0x3d995ef85a8d1bcbed78182ab225b9f88dc8937c',
                  created: '2018-01-01T21:10:10.615+00:00'
                }
              ]
            });
          }
        },
        lookForTx: () => ({
          remoteHash: 'ec049a808a09f3e8e257401e0898aa3d32a733706fd7d16aacf0ba95f7b42c0c',
          issuingAddress: '0x3d995ef85a8d1bcbed78182ab225b9f88dc8937c',
          time: '2018-06-01T20:47:55.000Z',
          revokedAddresses: []
        })
      };
    });
    const certificate = new Certificate(EthereumMainV2Valid);
    await certificate.init();
    const result = await certificate.verify();
    expect(result.status).toBe(VERIFICATION_STATUSES.SUCCESS);
    vi.restoreAllMocks();
  });
});
