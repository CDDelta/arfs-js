import Arweave from 'arweave';
import { Exclude } from 'class-transformer';
import { EntityTagMap, Transaction, TransactionAttributes } from 'src/utils';
import { Cipher } from './enums';

export abstract class Entity {
  /** The id of the transaction that represents this entity. */
  @Exclude({ toPlainOnly: true })
  transactionId: string;

  /** The address of the transaction owner that represents this entity. */
  @Exclude({ toPlainOnly: true })
  transactionOwnerAddress: string;

  /**
   * The time at which this entity was created.
   *
   * Extracted from the `Unix-Time` tag on the entity.
   */
  @Exclude({ toPlainOnly: true })
  createdAt: Date;

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
  abstract asTransaction(
    arweave: Arweave,
    txAttributes: TransactionAttributes,
    cipher?: Cipher,
    encryptionKey?: CryptoKey,
  ): Promise<Transaction>;

  /**
   * Converts this entity into an unsigned data item that can be included as part of an ANS-102
   * data bundle.
   *
   * Optionally specify a cipher and encryption key to encrypt this entity's data.
   */
  /*abstract asDataItem(
    arweaveBundler: ArweaveBundler,
    txAttributes: TransactionAttributes,
    cipher?: Cipher,
    encryptionKey?: CryptoKey,
  ): Promise<Transaction>;*/
}
