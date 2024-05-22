import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import sinon from 'sinon';
import * as ExplorerLookup from '@blockcerts/explorer-lookup';
import { Certificate } from '../../../src';
import fixture from '../../fixtures/v2/mainnet-valid-2.0.json';
import v2IssuerProfile from '../../assertions/v2-issuer-profile-5a4fe9931f607f0f3452a65e.json';

describe('Certificate entity test suite', function () {
  describe('constructor method', function () {
    describe('given it is called with valid v2 certificate data', function () {
      let certificate;
      let requestStub;

      beforeEach(async function () {
        requestStub = sinon.stub(ExplorerLookup, 'request');
        requestStub.withArgs({
          url: 'https://blockcerts.learningmachine.com/issuer/5a4fe9931f607f0f3452a65e.json'
        }).resolves(JSON.stringify(v2IssuerProfile));
        certificate = new Certificate(fixture);
        await certificate.init();
      });

      afterEach(function () {
        certificate = null;
        sinon.restore();
      });

      it('should set the certificateJson of the certificate object', function () {
        expect(certificate.certificateJson).toEqual(fixture);
      });

      it('should set certificateImage of the certificate object', function () {
        expect(certificate.certificateImage).toEqual(fixture.badge.image);
      });

      it('should set description of the certificate object', function () {
        expect(certificate.description).toEqual(fixture.badge.description);
      });

      it('should set id of the certificate object', function () {
        expect(certificate.id).toEqual(fixture.id);
      });

      it('should set issuedOn of the certificate object', function () {
        expect(certificate.issuedOn).toBe(fixture.issuedOn);
      });

      it('should set issuer of the certificate object', function () {
        expect(certificate.issuer).toEqual(v2IssuerProfile);
      });

      it('should set metadataJson of the certificate object', function () {
        expect(certificate.metadataJson).toEqual(fixture.metadataJson);
      });

      it('should set name to the certificate object', function () {
        expect(certificate.name).toEqual(fixture.badge.name);
      });

      it('should set recipientFullName of the certificate object', function () {
        const fullNameAssertion = fixture.recipientProfile.name;
        expect(certificate.recipientFullName).toEqual(fullNameAssertion);
      });

      it('should set recordLink of the certificate object', function () {
        expect(certificate.recordLink).toBe(fixture.id);
      });

      it('should set revocationKey of the certificate object', function () {
        expect(certificate.revocationKey).toEqual(null);
      });

      it('should set sealImage of the certificate object', function () {
        expect(certificate.sealImage).toEqual(v2IssuerProfile.image);
      });

      it('should set 1 signatureImage to the certificate object', function () {
        expect(certificate.signatureImage.length).toEqual(1);
      });
    });
  });
});
