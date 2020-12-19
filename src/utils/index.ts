import Arweave from 'arweave';
import { ContentType, Entity, EntityTag } from '../entities';
import { classToPlain } from 'class-transformer';

/** Temporary Arweave transaction mock */
export interface Transaction {
  id: string;
  owner: string;
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
 * Creates a transaction with the provided entity's data unencrypted and encoded as JSON,
 * including the appropriate `Content-Type` tag.
 */
export async function createUnencryptedEntityDataTransaction(
  entity: Entity,
  arweave: Arweave,
): Promise<Transaction> {
  const tx = await arweave.createTransaction({
    data: JSON.stringify(classToPlain(entity)),
  });

  addTagsToTx(tx, {
    'Content-Type': ContentType.Json,
  });

  return tx;
}
