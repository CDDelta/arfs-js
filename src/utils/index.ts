import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { classToPlain } from 'class-transformer';
import * as crypto from 'crypto';
import { ContentType, Entity, EntityTag } from 'src/entities';
import { TextDecoder } from 'util';

/** Temporary Arweave transaction mock */
export interface Transaction {
  id: string;
  owner: string;
  tags: { name: string; value: string }[];
  data: Uint8Array;
  addTag(name: string, value: string): void;
}

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

/**
 * Adds the latest ArFS tag to the transaction.
 */
export function addArFSTagToTx(tx: Transaction): void {
  addTagsToTx(tx, {
    ArFS: '0.11',
  });
}

/**
 * Timestamps the transaction with the current unix time in seconds by adding a `Unix-Time tag.
 */
export function addUnixTimestampTagToTx(
  tx: Transaction,
  timestamp: Date,
): void {
  addTagsToTx(tx, {
    'Unix-Time': (timestamp.valueOf() / 1000).toString(),
  });
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
  txAttributes: Partial<TransactionInterface>,
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
