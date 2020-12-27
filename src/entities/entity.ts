import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { Exclude } from 'class-transformer';
import { Transaction } from '../utils';
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
   * Converts this entity into a transaction that can be submitted to Arweave.
   *
   * Optionally specify a cipher and encryption key to encrypt this entity's data.
   */
  abstract asTransaction(
    arweave: Arweave,
    txAttributes: Partial<TransactionInterface>,
    cipher: Cipher | null,
    encryptionKey: CryptoKey | null,
  ): Promise<Transaction>;
}
