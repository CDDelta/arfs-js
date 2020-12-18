import Arweave from 'arweave';
import { classToPlain, Exclude } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { addTagsToTx, Transaction } from '../utils';
import { Entity } from './entity';
import { DriveAuthMode, DrivePrivacy, EntityType } from './enums';

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
    encryptionKey: CryptoKey,
  ): Promise<Transaction> {
    const tx = await arweave.createTransaction({
      data: JSON.stringify(classToPlain(this)),
    });

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
