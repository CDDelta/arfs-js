import { DataItemHeader } from 'arweave-stream-bundle';
import { EntityTagMap } from '../entities';
import { Transaction } from './interfaces';

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
 * Adds the provided map of tags to the provided data item header.
 *
 * Map entries that are `null` or `undefined` are ignored.
 */
export function addTagsToDataItemHeader(
  header: DataItemHeader,
  tags: EntityTagMap,
) {
  for (const [key, value] of Object.entries(tags)) {
    if (value != null) {
      header.addTag(key, value);
    }
  }
}
