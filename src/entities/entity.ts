import Arweave from 'arweave';
import { DataItem, DataItemHeader } from 'arweave-stream-bundle';
import { Exclude } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import {
  createEncryptedEntityDataItem,
  createEncryptedEntityTransaction,
} from '../crypto';
import {
  addTagsToDataItemHeader,
  addTagsToTx,
  createUnencryptedEntityDataItem,
  createUnencryptedEntityDataTransaction,
  Transaction,
  TransactionAttributes,
} from '../utils';
import { Cipher, EntityTagMap } from './tags';

export abstract class Entity<T extends Entity<T> = any> {
  /**
   * The id of the transaction that represents this entity.
   *
   * Undefined when the entity is first created.
   */
  @Exclude({ toPlainOnly: true })
  transactionId?: string;

  /**
   * The address of the owner of the transaction that represents this entity.
   *
   * Undefined when the entity is first created.
   */
  @Exclude({ toPlainOnly: true })
  transactionOwnerAddress?: string;

  /**
   * The tags that exists on this transaction.
   *
   * Undefined when the entity is first created.
   */
  @Exclude({ toPlainOnly: true })
  transactionTags: EntityTagMap;

  /**
   * The time at which this entity was created.
   *
   * Extracted from the `Unix-Time` tag on the entity.
   */
  @Exclude({ toPlainOnly: true })
  createdAt: Date;

  constructor(
    properties: Omit<T, keyof Omit<Entity<T>, 'createdAt'>>,
    validate = true,
  ) {
    // Workaround for class-transformer using the constructor.
    if (!properties) {
      return;
    }

    Object.assign(this, properties);

    if (validate) {
      validateOrReject(this);
    }
  }

  /**
   * Returns the tags that should be included when creating a transaction that represents
   * this entity.
   *
   * These tags partially include the data in this entity and ArFS version metadata.
   *
   * It does not include the transaction `Content-Type` or the entity's `Cipher` tags.
   */
  protected abstract getEntityTransactionTags(): EntityTagMap;

  /**
   * Converts this entity into an unsigned transaction that can be submitted to Arweave.
   *
   * Optionally specify a cipher and encryption key to encrypt this entity's data.
   */
  async asTransaction(
    arweave: Arweave,
    txAttributes: TransactionAttributes,
    cipher?: Cipher,
    encryptionKey?: CryptoKey,
  ): Promise<Transaction> {
    const tx =
      cipher && encryptionKey
        ? await createEncryptedEntityTransaction(this, arweave, txAttributes, {
            name: cipher,
            key: encryptionKey,
          })
        : await createUnencryptedEntityDataTransaction(
            this,
            arweave,
            txAttributes,
          );

    addTagsToTx(tx, this.getEntityTransactionTags());

    return tx;
  }

  /**
   * Converts this entity into an unsigned data item that can be included as part of an ANS-102
   * data bundle.
   *
   * Optionally specify a cipher and encryption key to encrypt this entity's data.
   */
  async asDataItem(
    dataItemProperties: Partial<DataItemHeader>,
    cipher?: Cipher,
    encryptionKey?: CryptoKey,
  ): Promise<DataItem> {
    const dataItem =
      cipher && encryptionKey
        ? await createEncryptedEntityDataItem(this, dataItemProperties, {
            name: cipher,
            key: encryptionKey,
          })
        : await createUnencryptedEntityDataItem(this, dataItemProperties);

    addTagsToDataItemHeader(dataItem.header, this.getEntityTransactionTags());

    return dataItem;
  }
}
