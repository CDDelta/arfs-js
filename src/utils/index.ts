import { EntityTag } from '../entities/enums';

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
