import Arweave from 'arweave';
import { classToPlain } from 'class-transformer';
import * as crypto from 'crypto';
import { ContentType, Entity, EntityTag } from 'src/entities';
import { TextDecoder } from 'util';
import { Transaction, TransactionAttributes } from './interfaces';

export * from './interfaces';

export type EntityTagMap = { [key in EntityTag]?: string };

/**
 * Adds the provided map of tags to the provided transaction.
 *
 * Map entries that are `null` or `undefined` are ignored.
 */
export function addTagsToTx(tx: Transaction, tags: EntityTagMap) {
  for (const [key, value] of Object.entries(tags)) {
    if (value != null) {
      tx.addTag(key, value);
    }
  }
}

/** The ArFS version the entities in this library are created with. */
export const arfsVersion = '0.11';

/** Formats the provided timestamp for the `Unix-Time` tag on an ArFS transaction. */
export function formatTxUnixTime(timestamp: Date) {
  return (timestamp.valueOf() / 1000).toString();
}

export function parseUnixTimeTagToDate(tagValue?: string): Date | null {
  return tagValue ? new Date(parseInt(tagValue) * 1000) : null;
}

/**
 * Creates a transaction with the provided entity's data unencrypted and encoded as JSON,
 * including the appropriate `Content-Type` tag.
 */
export async function createUnencryptedEntityDataTransaction(
  entity: Entity,
  arweave: Arweave,
  txAttributes: Partial<TransactionAttributes>,
): Promise<Transaction> {
  const tx = await arweave.createTransaction({
    ...txAttributes,
    data: JSON.stringify(classToPlain(entity)),
  });

  addTagsToTx(tx, {
    'Content-Type': ContentType.Json,
  });

  return tx;
}

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
