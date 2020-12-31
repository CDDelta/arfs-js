import Arweave from 'arweave';
import { Cipher, DriveAuthMode } from 'src/entities';
import uuid from 'uuid';

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
  const driveIdBytes = uuid.parse(driveId) as Uint8Array;

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

      return crypto.subtle.deriveKey(
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
        false,
        ['encrypt', 'decrypt', 'deriveKey'],
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
  fileId: string,
  driveKey: CryptoKey,
): Promise<CryptoKey> {
  const fileIdBytes = uuid.parse(fileId) as Uint8Array;

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      info: fileIdBytes,
    },
    driveKey,
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
