import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { Exclude } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { createEncryptedEntityTransaction } from '../crypto';
import {
  addTagsToTx,
  createUnencryptedEntityDataTransaction,
  Transaction,
} from '../utils';
import { Entity } from './entity';
import { Cipher, DriveAuthMode, DrivePrivacy, EntityType } from './enums';

export class DriveEntity extends Entity implements DriveEntityTransactionData {
  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  id: string;

  @IsEnum(DrivePrivacy)
  @Exclude({ toPlainOnly: true })
  privacy: DrivePrivacy;

  @IsEnum(DriveAuthMode)
  @Exclude({ toPlainOnly: true })
  authMode: DriveAuthMode;

  @IsString()
  @IsNotEmpty()
  name: string;

  /** The id of the folder that represents the root of this drive. */
  @IsString()
  @IsNotEmpty()
  rootFolderId: string;

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

    addTagsToTx(tx, {
      'Entity-Type': EntityType.Drive,
      'Drive-Id': this.id,
      'Drive-Privacy': this.privacy,
      'Drive-Auth-Mode': this.authMode,
    });

    return tx;
  }
}

export interface DriveEntityTransactionData {
  name: string;

  /** The id of the folder that represents the root of this drive. */
  rootFolderId: string;
}
