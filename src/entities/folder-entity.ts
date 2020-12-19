import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import Arweave from 'arweave';
import {
  Transaction,
  addTagsToTx,
  EntityTagMap,
  createUnencryptedEntityDataTransaction,
} from '../utils';
import { Entity } from './entity';
import { EntityType, Cipher } from './enums';
import { createEncryptedEntityTransaction } from '../crypto';
import { TransactionInterface } from 'arweave/node/lib/transaction';

export class FolderEntity
  extends Entity
  implements FolderEntityTransactionData {
  /**
   * The unique, persistent id of this folder.
   *
   * Extracted from the folder entity transaction's `Folder-Id` tag.
   */
  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  id: string;

  /**
   * The id of the drive this folder is contained in.
   *
   * Extracted from the folder entity transaction's `Drive-Id` tag.
   */
  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  driveId: string;

  /**
   * The id of this folder's parent folder entity.
   *
   * `null` when the folder has no parent ie. the folder is the root folder of a drive.
   *
   * Extracted from the folder entity transaction's `Parent-Folder-Id` tag.
   */
  @IsString()
  @Exclude({ toPlainOnly: true })
  parentFolderId: string | null;

  @IsString()
  @IsNotEmpty()
  name: string;

  async asTransaction(
    arweave: Arweave,
    txAttributes: Partial<TransactionInterface>,
    cipher: Cipher | null = null,
    driveKey: CryptoKey | null = null,
  ): Promise<Transaction> {
    const tx =
      cipher && driveKey
        ? await createEncryptedEntityTransaction(this, arweave, txAttributes, {
            name: cipher,
            key: driveKey,
          })
        : await createUnencryptedEntityDataTransaction(this, arweave);

    const tags: EntityTagMap = {
      'Entity-Type': EntityType.Folder,
      'Folder-Id': this.id,
      'Drive-Id': this.driveId,
    };

    if (this.parentFolderId) {
      tags['Parent-Folder-Id'] = this.parentFolderId;
    }

    addTagsToTx(tx, tags);

    return tx;
  }
}

export interface FolderEntityTransactionData {
  name: string;
}
