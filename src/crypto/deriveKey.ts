import Arweave from 'arweave';
import { Cipher, DriveAuthMode } from 'src/entities';
import { getSubtleCrypto } from 'src/utils';
import { parse as uuidParse } from 'uuid';

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
  wallet,
  arweave: Arweave,
  mode: DriveAuthModeParams | PasswordDriveAuthModeParams,
): Promise<CryptoKey> {
  const driveIdBytes = uuidParse(driveId) as Uint8Array;

  const walletSignature = null!;

  const walletSignatureKey = await crypto.subtle.importKey(
    'raw',
    walletSignature,
    'AES-GCM',
    false,
    ['deriveKey'],
  );

  switch (mode.name) {
    case DriveAuthMode.Password:
      utf8Encoder ||= new TextEncoder();

      const encodedPassword = utf8Encoder.encode(
        (mode as PasswordDriveAuthModeParams).password,
      );

      return await getSubtleCrypto().deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          info: encodedPassword,
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
    false,
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
