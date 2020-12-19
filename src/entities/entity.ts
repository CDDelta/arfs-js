import { Exclude } from 'class-transformer';
import { Transaction } from '../utils';
import Arweave from 'arweave';
import { Cipher, EntityTag } from './enums';
import { TransactionInterface } from 'arweave/node/lib/transaction';

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
