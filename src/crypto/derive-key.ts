import { TextEncoder } from 'util';
import { parse as uuidParse } from 'uuid';
import { Cipher, DriveAuthMode } from '../entities';
import { getSubtleCrypto } from '../utils';

let utf8Encoder: TextEncoder;

/**
 * Derives a drive key that can be used for encrypting and decrypting drive/folder entities,
 * and deriving file keys.
 *
 * Currently only supports AES-GCM.
 *
 * @param wallet the wallet of the owner of this drive.
 * @param driveId the id of the drive. Used to make this key unique for the provided wallet.
 * @param mode the mode with which to derive this drive key with.
 */
export async function deriveDriveKey(
  driveId: string,
  walletJwk: Object,
  mode: DriveAuthModeParams | PasswordDriveAuthModeParams,
): Promise<CryptoKey> {
  utf8Encoder ||= new TextEncoder();

  const subtleCrypto = getSubtleCrypto();

  const walletKey = await subtleCrypto.importKey(
    'jwk',
    walletJwk,
    {
      name: 'RSA-PSS',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  const walletSignature = await subtleCrypto.sign(
    {
      name: 'RSA-PSS',
      saltLength: 0,
    },
    walletKey,
    new Uint8Array([
      ...utf8Encoder.encode('drive'),
      ...(uuidParse(driveId) as Uint8Array),
    ]),
  );

  const walletSignatureKey = await subtleCrypto.importKey(
    'raw',
    walletSignature,
    'HKDF',
    false,
    ['deriveKey'],
  );

  switch (mode.name) {
    case DriveAuthMode.Password:
      const encodedPassword = utf8Encoder.encode(
        (mode as PasswordDriveAuthModeParams).password,
      );

      return await getSubtleCrypto().deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          info: encodedPassword,
          salt: new Uint8Array(0),
        },
        walletSignatureKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt'],
      );
  }
}

/**
 * Derives a file key that can be used for encrypting and decrypting file entities.
 *
 * Currently only supports AES256-GCM.
 *
 * @param fileId the id of the file. Used to make this key unique to this file.
 * @param driveKey the key of the drive this file is in.
 */
export async function deriveFileKey(
  driveKey: CryptoKey,
  fileId: string,
): Promise<CryptoKey> {
  const subtleCrypto = getSubtleCrypto();

  const fileIdBytes = uuidParse(fileId) as Uint8Array;
  const driveKeyBytes = await subtleCrypto.exportKey('raw', driveKey);

  const hkdfDriveKey = await subtleCrypto.importKey(
    'raw',
    driveKeyBytes,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return await subtleCrypto.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: fileIdBytes,
    },
    hkdfDriveKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

export interface DriveAuthModeParams {
  name: DriveAuthMode;
  cipher: Cipher;
}

export interface PasswordDriveAuthModeParams extends DriveAuthModeParams {
  password: string;
}
