import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { bufferTob64Url } from 'arweave/node/lib/utils';
import { classToPlain } from 'class-transformer';
import { Cipher, ContentType, Entity } from 'src/entities';
import { addTagsToTx, Transaction } from 'src/utils';

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
  let cryptoAlgo: AesGcmParams;

  switch (cipher.name) {
    case Cipher.AES256GCM:
      cryptoAlgo = {
        name: 'AES-GCM',
        // Use a 96-bit IV for AES-GCM as recommended.
        iv: crypto.getRandomValues(new Uint8Array(96 / 8)),
      };
  }

  const encryptedData = await crypto.subtle.encrypt(
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
        'Cipher-IV': bufferTob64Url(cryptoAlgo.iv as Uint8Array),
      });
  }

  addTagsToTx(tx, {
    'Content-Type': ContentType.OctetStream,
  });

  return tx;
}

export interface CipherParams {
  name: Cipher;
  key: CryptoKey;
}
