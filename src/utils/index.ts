import * as crypto from 'crypto';
import { TextDecoder } from 'util';

export * from './create-entity-transaction';
export * from './interfaces';
export * from './tags';
export * from './unix-time';

/** The ArFS version the entities in this library are created with. */
export const arfsVersion = '0.11';

/**
 * Returns the input as a UTF-8 string, decoding inbound ArrayBuffers into UTF-8
 * and simply returning strings as is.
 */
export function coerceToUtf8(input: string | ArrayBuffer): string {
  return typeof input === 'string' ? input : new TextDecoder().decode(input);
}

export function getSubtleCrypto(): SubtleCrypto {
  return (crypto as any).webcrypto.subtle;
}
