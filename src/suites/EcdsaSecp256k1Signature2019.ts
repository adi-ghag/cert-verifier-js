import domain from '../domain';
import jsigs from 'jsonld-signatures';
import jsonld from 'jsonld';
import { EcdsaSecp256k1VerificationKey2019 } from '@blockcerts/ecdsa-secp256k1-verification-key-2019';
import { EcdsaSecp256k1Signature2019 as Secp256k1VerificationSuite } from '@blockcerts/ecdsa-secp256k1-signature-2019';
import { Suite } from '../models/Suite';
import { VerifierError } from '../models';
import { preloadedContexts } from '../constants';
import { deepCopy } from '../helpers/object';
import { publicKeyBase58FromPublicKeyHex, publicKeyHexFromJwkSecp256k1 } from '../helpers/keyUtils';
import * as inspectors from '../inspectors';
import type { Blockcerts } from '../models/Blockcerts';
import type IVerificationMethod from '../models/VerificationMethod';
import type { Issuer } from '../models/Issuer';
import type VerificationSubstep from '../domain/verifier/valueObjects/VerificationSubstep';
import type { SuiteAPI } from '../models/Suite';
import type { BlockcertsV3, VCProof } from '../models/BlockcertsV3';
import type { IPublicKeyJwk } from '../helpers/keyUtils';
import type { IDidDocument } from '../models/DidDocument';

const { purposes: { AssertionProofPurpose, AuthenticationProofPurpose } } = jsigs;

enum SUB_STEPS {
  retrieveVerificationMethodPublicKey = 'retrieveVerificationMethodPublicKey',
  ensureVerificationMethodValidity = 'ensureVerificationMethodValidity',
  checkDocumentSignature = 'checkDocumentSignature'
}

export default class EcdsaSecp256k1Signature2019 extends Suite {
  public verificationProcess = [
    SUB_STEPS.retrieveVerificationMethodPublicKey,
    SUB_STEPS.ensureVerificationMethodValidity,
    SUB_STEPS.checkDocumentSignature
  ];

  public documentToVerify: Blockcerts;
  public issuer: Issuer;
  public proof: VCProof;
  public type = 'EcdsaSecp256k1Signature2019';
  public verificationKey: EcdsaSecp256k1VerificationKey2019;
  public verificationMethod: IVerificationMethod;
  public publicKey: any;
  public proofPurpose: string;
  public challenge: string;
  public domain: string | string[];
  private readonly proofPurposeMap: any;

  constructor (props: SuiteAPI) {
    super(props);
    if (props.executeStep) {
      this.executeStep = props.executeStep;
    }
    this.documentToVerify = props.document;
    this.issuer = props.issuer;
    this.proof = props.proof as VCProof;
    this.proofPurpose = props.proofPurpose ?? 'assertionMethod';
    this.challenge = props.proofChallenge ?? '';
    this.domain = props.proofDomain;
    this.proofPurposeMap = {
      authentication: AuthenticationProofPurpose,
      assertionMethod: AssertionProofPurpose
    };
    this.validateProofType();
  }

  async init (): Promise<void> {}

  async verifyProof (): Promise<void> {
    for (const verificationStep of this.verificationProcess) {
      if (!this[verificationStep]) {
        console.error('verification logic for', verificationStep, 'not implemented');
        return;
      }
      await this[verificationStep]();
    }
  }

  async verifyIdentity (): Promise<void> {}

  getProofVerificationSteps (parentStepKey): VerificationSubstep[] {
    // TODO: for now we are relying on i18n from this package, eventually we would want to split it and make this suite
    // TODO: standalone
    return this.verificationProcess.map(childStepKey =>
      domain.verifier.convertToVerificationSubsteps(parentStepKey, childStepKey)
    );
  }

  getIdentityVerificationSteps (): VerificationSubstep[] {
    return [];
  }

  getIssuerPublicKey (): string {
    return this.publicKey;
  }

  getIssuerName (): string {
    return this.issuer.name ?? '';
  }

  getIssuerProfileDomain (): string {
    try {
      const issuerProfileUrl = new URL(this.getIssuerProfileUrl());
      return issuerProfileUrl.hostname ?? '';
    } catch (e) {
      return '';
    }
  }

  getIssuerProfileUrl (): string {
    return this.issuer.id ?? '';
  }

  getSigningDate (): string {
    return this.proof.created;
  }

  async executeStep (step: string, action, verificationSuite: string): Promise<any> {
    throw new Error('doAction method needs to be overwritten by injecting from CVJS');
  }

  private validateProofType (): void {
    const proofType = this.isProofChain() ? this.proof.chainedProofType : this.proof.type;
    if (proofType !== this.type) {
      throw new Error(`Incompatible proof type passed. Expected: ${this.type}, Got: ${proofType}`);
    }
  }

  private isProofChain (): boolean {
    return this.proof.type === 'ChainedProof2021';
  }

  private generateDocumentLoader (): any {
    preloadedContexts[(this.documentToVerify as BlockcertsV3).issuer as string] = this.getTargetVerificationMethodContainer();
    const customLoader = function (url): any {
      if (url in preloadedContexts) {
        return {
          contextUrl: null,
          document: preloadedContexts[url],
          documentUrl: url
        };
      }
      return jsonld.documentLoader(url);
    };
    return customLoader;
  }

  private retrieveInitialDocument (): BlockcertsV3 {
    const document: BlockcertsV3 = deepCopy<BlockcertsV3>(this.documentToVerify as BlockcertsV3);
    if (Array.isArray(document.proof)) {
      // TODO: handle case when secp256k1 proof is chained
      const initialProof = document.proof.find(p => p.type === this.type);
      delete document.proof;
      document.proof = initialProof;
    }
    return document;
  }

  private getTargetVerificationMethodContainer (): Issuer | IDidDocument {
    if (this.issuer.didDocument) {
      const verificationMethod = this.findVerificationMethod(
        this.issuer.didDocument.verificationMethod, this.issuer.didDocument.id);
      if (verificationMethod) {
        return this.issuer.didDocument;
      }
    }

    // let's assume the verification method is in the issuer profile and further checks will fail
    // if that's not the case
    const controller = {
      ...this.issuer
    };
    delete controller.didDocument; // not defined in JSONLD for verification
    return controller;
  }

  private findVerificationMethod (verificationMethods: IVerificationMethod[], controller: string): IVerificationMethod {
    return verificationMethods.find(
      verificationMethod => {
        return verificationMethod.id === this.proof.verificationMethod ||
          controller + verificationMethod.id === this.proof.verificationMethod;
      }) ?? null;
  }

  private getErrorMessage (verificationStatus): string {
    return verificationStatus.error.errors[0].message;
  }

  private async retrieveVerificationMethodPublicKey (): Promise<void> {
    this.verificationKey = await this.executeStep(
      SUB_STEPS.retrieveVerificationMethodPublicKey,
      async (): Promise<EcdsaSecp256k1VerificationKey2019> => {
        this.verificationMethod = inspectors.retrieveVerificationMethodPublicKey(
          this.getTargetVerificationMethodContainer(),
          this.proof.verificationMethod
        );

        if (this.verificationMethod.publicKeyJwk && !this.verificationMethod.publicKeyBase58) {
          const hexKey = publicKeyHexFromJwkSecp256k1(this.verificationMethod.publicKeyJwk as IPublicKeyJwk);
          this.verificationMethod.publicKeyBase58 = publicKeyBase58FromPublicKeyHex(hexKey);

          if (!this.documentToVerify['@context'].includes('https://w3id.org/security/suites/secp256k1-2019/v1')) {
            this.documentToVerify['@context'].push('https://w3id.org/security/suites/secp256k1-2019/v1');
          }
        }
        this.publicKey = this.verificationMethod.publicKeyBase58;

        const key = EcdsaSecp256k1VerificationKey2019.from({
          ...this.verificationMethod as any // old package does not match CID definition of verification method
        });

        if (!key) {
          throw new VerifierError(SUB_STEPS.retrieveVerificationMethodPublicKey, 'Could not derive the verification key');
        }

        // TODO: revoked property should exist but we are currently using a forked implementation which does not expose it
        if ((key as any).revoked) {
          throw new VerifierError(SUB_STEPS.retrieveVerificationMethodPublicKey, 'The verification key has been revoked');
        }

        return key;
      },
      this.type
    );
  }

  private async ensureVerificationMethodValidity (): Promise<void> {
    await this.executeStep(
      SUB_STEPS.ensureVerificationMethodValidity,
      async (): Promise<void> => {
        if (this.verificationMethod.expires) {
          const expirationDate = new Date(this.verificationMethod.expires).getTime();
          if (expirationDate < Date.now()) {
            throw new VerifierError(SUB_STEPS.ensureVerificationMethodValidity, 'The verification key has expired');
          }
        }

        if (this.verificationMethod.revoked) {
          // waiting on clarification https://github.com/w3c/cid/issues/152
          throw new VerifierError(SUB_STEPS.ensureVerificationMethodValidity, 'The verification key has been revoked');
        }
      },
      this.type
    );
  }

  private async checkDocumentSignature (): Promise<void> {
    await this.executeStep(
      SUB_STEPS.checkDocumentSignature,
      async (): Promise<void> => {
        const suite = new Secp256k1VerificationSuite({ key: this.verificationKey });
        // TODO: date property should exist but we are currently using a forked implementation which does not expose it
        (suite as any).date = new Date(Date.now()).toISOString();

        if (this.proofPurpose === 'authentication' && !this.proof.challenge) {
          this.proof.challenge = '';
        }

        const verificationStatus = await jsigs.verify(this.retrieveInitialDocument(), {
          suite,
          purpose: new this.proofPurposeMap[this.proofPurpose]({
            controller: this.getTargetVerificationMethodContainer(),
            challenge: this.challenge,
            domain: this.domain
          }),
          documentLoader: this.generateDocumentLoader()
        });

        if (!verificationStatus.verified) {
          console.error(JSON.stringify(verificationStatus, null, 2));
          throw new VerifierError(SUB_STEPS.checkDocumentSignature,
            `The document's ${this.type} signature could not be confirmed: ${this.getErrorMessage(verificationStatus)}`
          );
        } else {
          console.log('Credential Secp256k1 signature successfully verified');
        }
      },
      this.type
    );
  }
}
