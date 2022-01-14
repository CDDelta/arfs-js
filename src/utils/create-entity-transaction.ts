import Arweave from 'arweave';
import { DataItem, DataItemHeader } from 'arweave-stream-bundle';
import Transaction from 'arweave/node/lib/transaction';
import { classToPlain } from 'class-transformer';
import { ReadableStream } from 'stream/web';
import { ContentType, Entity, EntityTag } from '../entities';
import { TransactionAttributes } from './interfaces';
import { addTagsToTx } from './tags';

let utf8Encoder: TextEncoder;

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
  dataItemProperties: Partial<DataItemHeader>,
): Promise<DataItem> {
  utf8Encoder ||= new TextEncoder();

  const header = new DataItemHeader(dataItemProperties);
  header.addTag(EntityTag.ContentType, ContentType.Json);

  return new DataItem(
    header,
    () => new ReadableStream({
      type: 'bytes',
      start: (controller) => {
        const entityJson = JSON.stringify(classToPlain(entity));
        controller.enqueue(utf8Encoder.encode(entityJson));
        controller.close();
      },
    }),
  );
}
