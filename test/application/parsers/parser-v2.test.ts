import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import parseJSON from '../../../src/parsers/index';
import v2IssuerProfile from '../../assertions/v2-issuer-profile-5a4fe9931f607f0f3452a65e.json';
import MainnetV2Valid from '../../fixtures/v2/mainnet-valid-2.0.json';

const fixture = MainnetV2Valid;

describe('Parser test suite', function () {
  describe('given it is called with a invalid format v2 certificate data', function () {
    it('should set whether or not the certificate format is valid', async function () {
      const fixtureCopy = JSON.parse(JSON.stringify(fixture));
      fixtureCopy.badge.issuer = 'not a url';
      const parsedCertificate = await parseJSON(fixtureCopy);
      expect(parsedCertificate.isFormatValid).toBe(false);
    });
  });

  describe('given it is called with valid v2 certificate data', function () {
    let parsedCertificate;

    beforeAll(async function () {
      vi.mock('@blockcerts/explorer-lookup', async (importOriginal) => {
        const explorerLookup = await importOriginal();
        return {
          ...explorerLookup,
          request: async function ({ url }) {
            if (url === 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e.json') {
              return JSON.stringify(v2IssuerProfile);
            }
          }
        };
      });
      parsedCertificate = await parseJSON(fixture);
    });

    afterAll(function () {
      vi.restoreAllMocks();
    });

    it('should set the certificateImage of the certificate object', function () {
      expect(parsedCertificate.certificateImage).toEqual(fixture.badge.image);
    });

    it('should set the description of the certificate object', function () {
      expect(parsedCertificate.description).toEqual(fixture.badge.description);
    });

    it('should set the id of the certificate object', function () {
      expect(parsedCertificate.id).toEqual(fixture.id);
    });

    it('should set issuedOn of the certificate object', function () {
      expect(parsedCertificate.issuedOn).toBe(fixture.issuedOn);
    });

    it('should set the issuer of the certificate object', function () {
      expect(parsedCertificate.issuer).toEqual(v2IssuerProfile);
    });

    it('should set metadataJson of the certificate object', function () {
      expect(parsedCertificate.metadataJson).toEqual(fixture.metadataJson);
    });

    it('should set the name of the certificate object', function () {
      expect(parsedCertificate.name).toEqual(fixture.badge.name);
    });

    it('should set the recipientFullName of the certificate object', function () {
      const fullNameAssertion = fixture.recipientProfile.name;
      expect(parsedCertificate.recipientFullName).toEqual(fullNameAssertion);
    });

    it('should set recordLink of the certificate object', function () {
      expect(parsedCertificate.recordLink).toBe(fixture.id);
    });

    it('should set the revocationKey of the certificate object', function () {
      expect(parsedCertificate.revocationKey).toEqual(null);
    });

    it('should set the sealImage of the certificate object', function () {
      expect(parsedCertificate.sealImage).toEqual(v2IssuerProfile.image);
    });

    it('should set 1 signatureImage to the certificate object', function () {
      expect(parsedCertificate.signatureImage.length).toEqual(1);
    });
  });
});
