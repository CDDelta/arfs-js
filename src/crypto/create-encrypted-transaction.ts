import Arweave from 'arweave';
import { DataItemJson } from 'arweave-bundles';
import { bufferTob64Url } from 'arweave/node/lib/utils';
import { classToPlain } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Cipher, ContentType, Entity, EntityTagMap } from 'src/entities';
import {
  addTagsToDataItem,
  addTagsToTx,
  ArweaveBundler,
  getSubtleCrypto,
  Transaction,
  TransactionAttributes,
} from 'src/utils';

let utf8Encoder: TextEncoder;

/**
 * Encrypts the provided entity's data into an Arweave transaction, and
 * adds the necessary tags to decrypt it later on.
 */
export async function createEncryptedEntityTransaction(
  entity: Entity,
  arweave: Arweave,
  txAttributes: TransactionAttributes,
  cipher: CipherParams,
): Promise<Transaction> {
  // Lazily create the TextEncoder.
  utf8Encoder ||= new TextEncoder();

  const encodedData = utf8Encoder.encode(JSON.stringify(classToPlain(entity)));

  return createEncryptedTransaction(encodedData, arweave, txAttributes, cipher);
}

/**
 * Encrypts the provided data into an Arweave transaction, and
 * adds the necessary tags to decrypt it later on.
 */
export async function createEncryptedTransaction(
  data: ArrayBuffer,
  arweave: Arweave,
  txAttributes: TransactionAttributes,
  cipher: CipherParams,
): Promise<Transaction> {
  const res = await encryptDataForTransaction(data, cipher);

  const tx = await arweave.createTransaction({
    ...txAttributes,
    data: res.data,
  });

  addTagsToTx(tx, res.encryptionTags);

  return tx;
}

/**
 * Encrypts the provided entity's data into an ANS-102 data item, and
 * adds the necessary tags to decrypt it later on.
 */
export async function createEncryptedEntityDataItem(
  entity: Entity,
  bundler: ArweaveBundler,
  itemAttributes: TransactionAttributes,
  cipher: CipherParams,
): Promise<DataItemJson> {
  // Lazily create the TextEncoder.
  utf8Encoder ||= new TextEncoder();

  const encodedData = utf8Encoder.encode(JSON.stringify(classToPlain(entity)));

  const res = await encryptDataForTransaction(encodedData, cipher);

  const item = await bundler.createData(
    {
      ...itemAttributes,
      data: new Uint8Array(res.data),
    },
    {
      n: itemAttributes.owner,
    } as any,
  );

  addTagsToDataItem(item, res.encryptionTags, bundler);

  return item;
}

export interface CipherParams {
  name: Cipher;
  key: CryptoKey;
}

interface TransactionEncryptionResult {
  data: ArrayBuffer;
  encryptionTags: EntityTagMap;
}

async function encryptDataForTransaction(
  data: ArrayBuffer,
  cipher: CipherParams,
): Promise<TransactionEncryptionResult> {
  const subtleCrypto = getSubtleCrypto();

  let cryptoAlgo: Algorithm;

  switch (cipher.name) {
    case Cipher.AES256GCM:
      cryptoAlgo = {
        name: 'AES-GCM',
        // Use a 96-bit IV for AES-GCM as recommended.
        iv: randomBytes(96 / 8),
      } as AesGcmParams;
      break;
  }

  const encryptedData = await subtleCrypto.encrypt(
    cryptoAlgo,
    cipher.key,
    data,
  );

  const tags: EntityTagMap = {};

  switch (cipher.name) {
    case Cipher.AES256GCM:
      tags['Cipher-IV'] = bufferTob64Url(
        (cryptoAlgo as AesGcmParams).iv as Uint8Array,
      );
      break;
  }

  tags.Cipher = cipher.name;
  tags['Content-Type'] = ContentType.OctetStream;

  return {
    data: encryptedData,
    encryptionTags: tags,
  };
}
