import { DataItemJson } from 'arweave-bundles';
import { EntityTagMap } from 'src/entities';
import { ArweaveBundler, Transaction } from './interfaces';

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
 * Adds the provided map of tags to the provided data item.
 *
 * Map entries that are `null` or `undefined` are ignored.
 */
export function addTagsToDataItem(
  item: DataItemJson,
  tags: EntityTagMap,
  bundler: ArweaveBundler,
) {
  for (const [key, value] of Object.entries(tags)) {
    if (value != null) {
      bundler.addTag(item, key, value);
    }
  }
}
