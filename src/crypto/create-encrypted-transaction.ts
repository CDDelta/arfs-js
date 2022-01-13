import Arweave from 'arweave';
import { DataItem, DataItemHeader } from 'arweave-stream-bundle';
import { bufferTob64Url } from 'arweave/node/lib/utils';
import { classToPlain } from 'class-transformer';
import { randomBytes } from 'crypto';
import { ReadableStream } from 'stream/web';
import { Cipher, ContentType, Entity, EntityTagMap } from '../entities';
import {
  addTagsToDataItemHeader,
  addTagsToTx,
  getSubtleCrypto,
  Transaction,
  TransactionAttributes,
} from '../utils';

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
  dataItemProperties: Partial<DataItemHeader>,
  cipher: CipherParams,
): Promise<DataItem> {
  // Lazily create the TextEncoder.
  utf8Encoder ||= new TextEncoder();

  const encodedData = utf8Encoder.encode(JSON.stringify(classToPlain(entity)));

  const res = await encryptDataForTransaction(encodedData, cipher);

  const header = new DataItemHeader(dataItemProperties);
  addTagsToDataItemHeader(header, res.encryptionTags);

  return new DataItem(
    header,
    new ReadableStream({
      type: 'bytes',
      start: (controller) => {
        controller.enqueue(new Uint8Array(res.data));
        controller.close();
      },
    }),
  );
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
