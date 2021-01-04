import Arweave from 'arweave';
import { DataItemJson } from 'arweave-bundles';
import Transaction from 'arweave/node/lib/transaction';
import { classToPlain } from 'class-transformer';
import { ContentType, Entity, EntityTag } from '../entities';
import {
  ArweaveBundler,
  DataItemAttributes,
  TransactionAttributes,
} from './interfaces';
import { addTagsToTx } from './tags';

/**
 * Creates a transaction with the provided entity's data unencrypted and encoded as JSON,
 * including the appropriate `Content-Type` tag.
 */
export async function createUnencryptedEntityDataTransaction(
  entity: Entity,
  arweave: Arweave,
  txAttributes: TransactionAttributes,
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
 * Creates a transaction with the provided entity's data unencrypted and encoded as JSON,
 * including the appropriate `Content-Type` tag.
 */
export async function createUnencryptedEntityDataItem(
  entity: Entity,
  bundler: ArweaveBundler,
  itemAttributes: DataItemAttributes,
): Promise<DataItemJson> {
  return await bundler.createData(
    {
      ...itemAttributes,
      data: JSON.stringify(classToPlain(entity)),
      tags: [
        {
          name: EntityTag.ContentType,
          value: ContentType.Json,
        },
      ],
    },
    {
      n: itemAttributes.owner,
    } as any,
  );
}
