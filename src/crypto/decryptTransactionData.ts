import { Cipher, EntityTag } from '../entities';
import { EntityTagMap } from '../utils';

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
  let cryptoAlgo;

  if (txTags[EntityTag.Cipher] === Cipher.AES256GCM) {
    const iv = txTags[EntityTag.CipherIV];
    if (iv) {
      cryptoAlgo = {
        name: 'AES-GCM',
        iv: iv,
      };
    }
  }

  const decryptedData = await crypto.subtle.decrypt(cryptoAlgo, key, txData);

  return decryptedData;
}
