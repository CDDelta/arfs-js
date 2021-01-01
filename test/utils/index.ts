import Arweave from 'arweave';
import { EntityTagMap, getSubtleCrypto } from '../../src/utils';

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
    map[atob(tag.name)] = atob(tag.value);
    return map;
  }, {});
}

export async function importAesGcmKey(bytes: ArrayBuffer): Promise<CryptoKey> {
  return await getSubtleCrypto().importKey('raw', bytes, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
}
