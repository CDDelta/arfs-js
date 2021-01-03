import Arweave from 'arweave';
import { b64UrlToString } from 'arweave/node/lib/utils';
import { EntityTagMap } from 'src';
import { getSubtleCrypto } from '../../src/utils';

export function getArweaveClient(): Arweave {
  return Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });
}

export function tagListToMap(
  tags: { name: string; value: string }[],
): EntityTagMap {
  return tags.reduce((map, tag) => {
    map[b64UrlToString(tag.name)] = b64UrlToString(tag.value);
    return map;
  }, {});
}

export async function importAesGcmKey(bytes: ArrayBuffer): Promise<CryptoKey> {
  return await getSubtleCrypto().importKey('raw', bytes, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
}
