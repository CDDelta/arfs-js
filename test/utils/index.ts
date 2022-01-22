import Arweave from 'arweave';
import { b64UrlToString } from 'arweave/node/lib/utils';
import { createHash } from 'crypto';
import { EntityTagMap } from '../../src';
import { getSubtleCrypto } from '../../src/utils';

const arweave = getArweaveClient();

export const MOCK_OWNER = createHash('sha256').update('MOCK_OWNER').digest();

export function getArweaveClient(): Arweave {
  return Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });
}

export async function rawOwnerBytesToB64UrlAddress(
  owner: Uint8Array,
): Promise<string> {
  return await arweave.wallets.ownerToAddress(
    Buffer.from(owner).toString('base64url'),
  );
}

export function txTagListToMap(
  tags: { name: string; value: string }[],
): EntityTagMap {
  return tags.reduce((map, tag) => {
    map[b64UrlToString(tag.name)] = b64UrlToString(tag.value);
    return map;
  }, {});
}

export function dataItemTagListToMap(
  tags: { name: string; value: string }[],
): EntityTagMap {
  return tags.reduce((map, tag) => {
    map[tag.name] = tag.value;
    return map;
  }, {});
}

export async function importAesGcmKey(bytes: ArrayBuffer): Promise<CryptoKey> {
  return await getSubtleCrypto().importKey('raw', bytes, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
}
