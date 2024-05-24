import { describe, it, expect } from 'vitest';
import { Certificate } from '../../../src';
import TestnetV1Valid from '../../fixtures/v1/testnet-valid-1.2.json';

describe('Certificate entity test suite', function () {
  describe('constructor method', function () {
    describe('given it is called with valid v1 certificate data', function () {
      it('should not support the verification and throw an error', async function () {
        const certificate = new Certificate(TestnetV1Valid as any);
        await expect(async () => {
          await certificate.init();
        }).rejects.toThrow('Verification of v1 certificates is not supported by this component. ' +
          'See the python cert-verifier for v1.1 verification ' +
          'or the npm package cert-verifier-js-v1-legacy for v1.2 ' +
          '(https://www.npmjs.com/package/@blockcerts/cert-verifier-js-v1-legacy)');
      });
    });
  });
});
