import { b64UrlToBuffer, bufferTob64Url } from 'arweave/node/lib/utils';
import { Cipher, deriveDriveKey, deriveFileKey, DriveAuthMode } from 'src';
import { getSubtleCrypto } from 'src/utils';
import testKey from '../fixtures/test-key.json';
import { importKey } from '../utils';

describe('deriveDriveKey()', () => {
  test('can derive correct password key', async () => {
    const driveKey = await deriveDriveKey(
      '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      testKey,
      {
        name: DriveAuthMode.Password,
        password: '<password provided by user>',
        cipher: Cipher.AES256GCM,
      },
    );

    const driveKeyBytes = await getSubtleCrypto().exportKey('raw', driveKey);

    expect(bufferTob64Url(new Uint8Array(driveKeyBytes))).toEqual(
      '_BswoSJy8cGrHQN7xge2naIiGajCEV7yfC0MXD_XBig',
    );
  });
});

describe('deriveFileKey()', () => {
  test('can derive correct file key', async () => {
    const driveKey = await importKey(
      b64UrlToBuffer('_BswoSJy8cGrHQN7xge2naIiGajCEV7yfC0MXD_XBig'),
    );

    const fileKey = await deriveFileKey(
      driveKey,
      '225f09b7-84c0-495f-b4e6-1c775a6976d0',
    );

    const fileKeyBytes = await getSubtleCrypto().exportKey('raw', fileKey);

    expect(bufferTob64Url(new Uint8Array(fileKeyBytes))).toEqual(
      '_pl7qmnwd7HENIh3jKBImz7jkwTCntNaPyAeoVX8BBs',
    );
  });
});
