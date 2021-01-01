import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { bufferTob64Url } from 'arweave/node/lib/utils';
import { classToPlain } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Cipher, ContentType, Entity } from 'src/entities';
import { addTagsToTx, getSubtleCrypto, Transaction } from 'src/utils';

let utf8Encoder: TextEncoder;

/**
 * Encrypts the provided entity's data, sets it on the specified transaction, and
 * adds the necessary tags to decrypt it later on.
 */
export async function createEncryptedEntityTransaction(
  entity: Entity,
  arweave: Arweave,
  txAttributes: Partial<TransactionInterface>,
  cipher: CipherParams,
): Promise<Transaction> {
  // Lazily create the TextEncoder.
  utf8Encoder ||= new TextEncoder();

  const encodedData = utf8Encoder.encode(JSON.stringify(classToPlain(entity)));

  return createEncryptedTransaction(encodedData, arweave, txAttributes, cipher);
}

/**
 * Encrypts the provided data, sets it on the specified transaction, and
 * adds the necessary tags to decrypt it later on.
 */
export async function createEncryptedTransaction(
  data: ArrayBuffer,
  arweave: Arweave,
  txAttributes: Partial<TransactionInterface>,
  cipher: CipherParams,
): Promise<Transaction> {
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

  const tx = await arweave.createTransaction({
    ...txAttributes,
    data: encryptedData,
  });

  switch (cipher.name) {
    case Cipher.AES256GCM:
      addTagsToTx(tx, {
        'Cipher-IV': bufferTob64Url(
          (cryptoAlgo as AesGcmParams).iv as Uint8Array,
        ),
      });
      break;
  }

  addTagsToTx(tx, {
    Cipher: cipher.name,
    'Content-Type': ContentType.OctetStream,
  });

  return tx;
}

export interface CipherParams {
  name: Cipher;
  key: CryptoKey;
}
