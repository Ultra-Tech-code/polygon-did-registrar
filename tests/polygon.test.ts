import {
  testDidDetails,
  resourceJson,
  testResourceId,
  updateDidDocument,
  testContractDetails,
} from './fixtures/test.data'
import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import { arrayHasKeys } from './utils/array'
import { PolygonDID } from '../src/registrar'

const NETWORK_URL = testContractDetails.networkUrl
const CONTRACT_ADDRESS = testContractDetails.contractAddress //Can add external smart contract address

describe('Registrar', () => {
  let polygonDidRegistrar: PolygonDID
  let polygonDID: string
  let keyPair: {
    address: string
    privateKey: string
    publicKeyBase58: string
    did: string
  } = {
    address: '',
    privateKey: '',
    publicKeyBase58: '',
    did: '',
  }

  before(async () => {
    keyPair.address = testDidDetails.address
    keyPair.did = testDidDetails.did
    keyPair.privateKey = testDidDetails.privateKey //test key
    keyPair.publicKeyBase58 = testDidDetails.publicKeyBase58
    polygonDID = testDidDetails.did

    if (!keyPair.address && !keyPair.did) {
      keyPair = PolygonDID.createKeyPair('testnet')
      polygonDID = keyPair.did
    }

    polygonDidRegistrar = new PolygonDID({
      contractAddress: CONTRACT_ADDRESS,
      rpcUrl: NETWORK_URL,
      privateKey: keyPair.privateKey,
    })
    await new Promise((r) => setTimeout(r, 5000))
  })

  describe('test create did function', () => {
    it('should get address', async () => {
      assert.ok(keyPair.address)
      assert.strictEqual(keyPair.address.slice(0, 2), '0x')
      assert.strictEqual(keyPair.address.length, 42)
    })

    it('should get public key base58', async () => {
      assert.ok(keyPair.publicKeyBase58)
    })

    it('should get polygon DID', async () => {
      if (keyPair && keyPair.did.split(':')[2] === 'testnet') {
        assert.ok(keyPair.did)
        assert.strictEqual(keyPair.did.slice(0, 19), 'did:polygon:testnet')
        assert.strictEqual(keyPair.did.slice(20, 22), '0x')
        assert.strictEqual(keyPair.did.split(':')[3].length, 42)
      } else {
        assert.ok(keyPair.did)
        assert.strictEqual(keyPair.did.slice(0, 19), 'did:polygon')
        assert.strictEqual(keyPair.did.slice(20, 22), '0x')
        assert.strictEqual(keyPair.did.split(':')[3].length, 42)
      }
    })
  })

  describe('test register DID function', () => {
    let registerDidRes: any

    before(async () => {
      registerDidRes = await polygonDidRegistrar.create({
        did: polygonDID,
        publicKeyBase58: keyPair.publicKeyBase58,
        serviceEndpoint: 'https://example.com',
      })
    })

    it('should get transaction hash after DID register ', () => {
      assert.ok(registerDidRes.txnHash)
      assert.equal(
        arrayHasKeys(Object.keys(registerDidRes.txnHash), [
          'provider',
          'blockNumber',
          'blockHash',
          'index',
          'hash',
          'type',
          'to',
          'from',
          'nonce',
          'gasLimit',
          'gasPrice',
          'maxPriorityFeePerGas',
          'maxFeePerGas',
          'data',
          'value',
          'chainId',
          'signature',
          'accessList',
        ]),
        true,
      )
    })
  })


  describe('test update DID doc function', () => {
    let updateDidRes: any

    before(async () => {
      updateDidRes = await polygonDidRegistrar.update(
        polygonDID,
        updateDidDocument,
      )
    })
    it('should be updated DID Document for update DID document', async () => {
      assert.ok(updateDidRes)
      assert.equal(Object.keys(JSON.parse(updateDidDocument)), [
        '@context',
        'id',
        'verificationMethod',
      ])
    })

    it('should get transaction hash after update DID document', async () => {
      if (updateDidRes && updateDidRes.txnHash) {
        assert.ok(updateDidRes.txnHash)
        assert.equal(
          arrayHasKeys(Object.keys(updateDidRes.txnHash), [
            'nonce',
            'gasPrice',
            'gasLimit',
            'to',
            'value',
            'data',
            'chainId',
            'v',
            'r',
            's',
            'from',
            'hash',
            'type',
            'wait',
          ]),
          true,
        )
      } else {
        assert.fail('updateDidRes is not valid')
      }
    })
  })

  describe('test register DID linked-resource function', () => {
    let addResource: any;

    before(async () => {
      addResource = await polygonDidRegistrar.addResource(
        polygonDID,
        resourceJson
      )
    })

    it('should get transaction hash after register DID document', async () => {
      assert.ok(addResource.txnHash)
      assert.equal(
        arrayHasKeys(Object.keys(addResource.txnHash), [
          'nonce',
          'gasPrice',
          'gasLimit',
          'to',
          'value',
          'data',
          'chainId',
          'v',
          'r',
          's',
          'from',
          'hash',
          'type',
          'wait',
        ]),
        true,
      )
    })

  })

  describe('test resolve all DID linked-resource by DID function', () => {
    let resolveResourceByDid:any;

    before(async () => {
      resolveResourceByDid = await polygonDidRegistrar.getResourcesByDid(
        polygonDID
      )
    })

    it('should match correct resource details after resolving linked resource with valid DID', async () => {

      const expectedKeys = [
        'resourceURI',
        'resourceCollectionId',
        'resourceId',
        'resourceName',
        'resourceType',
        'mediaType',
        'created',
        'checksum',
        'previousVersionId',
        'nextVersionId',
      ];

      resolveResourceByDid.linkedResource.forEach((resource:any) => {
        assert.deepStrictEqual(Object.keys(resource), expectedKeys);
      });
    });

  })

  describe('test resolve DID linked-resource by DID and resourceId function', () => {
    let resolveResourceByDid: any;

    before(async () => {
      resolveResourceByDid = await polygonDidRegistrar.getResourceByDidAndResourceId(
        polygonDID,
        testResourceId
      )
    })

    it('should match correct resource details after resolving linked resource with valid DID', async () => {

      const expectedKeys = [
        'resourceURI',
        'resourceCollectionId',
        'resourceId',
        'resourceName',
        'resourceType',
        'mediaType',
        'created',
        'checksum',
        'previousVersionId',
        'nextVersionId',
      ];

     assert.deepStrictEqual(Object.keys(resolveResourceByDid), expectedKeys);
    });

  })
})
