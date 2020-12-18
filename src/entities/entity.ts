import { Exclude } from 'class-transformer';
import { Transaction } from '../utils';
import Arweave from 'arweave';

export abstract class Entity {
  /** The id of the transaction that represents this entity. */
  @Exclude()
  transactionId: string;

  /** The address of the transaction owner that represents this entity. */
  @Exclude()
  transactionOwnerAddress: string;

  /**
   * The timestamp at which this entity transaction was created.
   *
   * Extracted from the `Unix-Time` tag on the entity.
   */
  @Exclude()
  transactionTimestamp: Date;

  abstract asTransaction(
    arweave: Arweave,
    encryptionKey: CryptoKey,
  ): Promise<Transaction>;
}
