import { Exclude } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { Entity } from './entity';
import Arweave from 'arweave';
import {
  addTagsToTx,
  Transaction,
  createUnencryptedEntityDataTransaction,
} from '../utils';
import { Cipher, EntityType } from './enums';
import { createEncryptedEntityTransaction } from '../crypto';
import { TransactionInterface } from 'arweave/node/lib/transaction';

export class FileEntity extends Entity implements FileEntityTransactionData {
  /**
   * The unique, persistent id of this file.
   *
   * Extracted from the file entity transaction's `File-Id` tag.
   */
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  id: string;

  /**
   * The id of the drive this file is contained in.
   *
   * Extracted from the file entity transaction's `Drive-Id` tag.
   */
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  driveId: string;

  /**
   * The id of this file's parent folder entity.
   *
   * Never `null` as files should always have a parent.
   * Files at the root folder of a drive should assign the root folder as their parent.
   */
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  parentFolderId: string;

  @IsNotEmpty()
  name: string;

  /** The original size of the file before any encoding in bytes. */
  @IsNumber()
  size: number;

  @IsDate()
  lastModifiedDate: Date;

  /**
   * The id of the transaction storing the raw binary data of this file.
   *
   * This can refer to a top-level transaction or data item created using ANS-102.
   */
  @IsNotEmpty()
  dataTxId: string;

  /**
   * The `Content-Type` of the raw binary data.
   *
   * Should be the same as the `Content-Type` tag on the data transaction.
   */
  @IsNotEmpty()
  dataContentType: string;

  async asTransaction(
    arweave: Arweave,
    txAttributes: Partial<TransactionInterface>,
    cipher: Cipher | null = null,
    fileKey: CryptoKey | null = null,
  ): Promise<Transaction> {
    const tx =
      cipher && fileKey
        ? await createEncryptedEntityTransaction(this, arweave, txAttributes, {
            name: cipher,
            key: fileKey,
          })
        : await createUnencryptedEntityDataTransaction(this, arweave);

    addTagsToTx(tx, {
      'Entity-Type': EntityType.File,
      'File-Id': this.id,
      'Drive-Id': this.driveId,
      'Parent-Folder-Id': this.parentFolderId,
    });

    return tx;
  }
}

export interface FileEntityTransactionData {
  name: string;
  size: number;
  lastModifiedDate: Date;
  dataTxId: string;
  dataContentType: string;
}
