import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { Cipher, EntityTag } from 'src/entities';
import { EntityTagMap, getSubtleCrypto } from 'src/utils';
import { TextDecoder } from 'util';

let utf8Decoder: TextDecoder;

/**
 * Decrypts and returns the entity of an ArFS transaction.
 *
 * Type cast is merely for convenience and does not perform any validation.
 */
export async function decryptEntityTransactionData<T>(
  txData: ArrayBuffer,
  txTags: EntityTagMap,
  key: CryptoKey,
): Promise<T> {
  // Lazily create the TextDecoder.
  utf8Decoder ||= new TextDecoder();

  const decryptedData = await decryptTransactionData(txData, txTags, key);

  return JSON.parse(utf8Decoder.decode(decryptedData)) as T;
}

/**
 * Decrypts and returns the data of an ArFS transaction.
 */
export async function decryptTransactionData(
  txData: ArrayBuffer,
  txTags: EntityTagMap,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  let cryptoAlgo: Algorithm;

  const cipher = txTags[EntityTag.Cipher];

  switch (cipher) {
    case Cipher.AES256GCM:
      const iv = txTags[EntityTag.CipherIV];
      if (!iv) {
        throw Error('No IV specified for AES-GCM.');
      }

      cryptoAlgo = {
        name: 'AES-GCM',
        iv: b64UrlToBuffer(iv),
      } as AesGcmParams;
      break;
    default:
      throw Error('No valid cipher specified on transaction.');
  }

  const decryptedData = await getSubtleCrypto().decrypt(
    cryptoAlgo,
    key,
    txData,
  );

  return decryptedData;
}
