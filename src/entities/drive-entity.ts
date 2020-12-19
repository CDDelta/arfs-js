import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { Exclude, plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateOrReject,
} from 'class-validator';
import {
  createEncryptedEntityTransaction,
  decryptEntityTransactionData,
} from '../crypto';
import {
  addArFSTagToTx,
  addTagsToTx,
  addUnixTimestampTagToTx,
  createUnencryptedEntityDataTransaction,
  EntityTagMap,
  parseUnixTimeTagToDate,
  Transaction,
} from '../utils';
import { Entity } from './entity';
import {
  Cipher,
  DriveAuthMode,
  DrivePrivacy,
  EntityTag,
  EntityType,
} from './enums';

export class DriveEntity extends Entity implements DriveEntityTransactionData {
  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  id: string;

  @IsEnum(DrivePrivacy)
  @Exclude({ toPlainOnly: true })
  privacy: DrivePrivacy;

  @IsOptional()
  @IsEnum(DriveAuthMode)
  @Exclude({ toPlainOnly: true })
  authMode: DriveAuthMode | undefined;

  @IsString()
  @IsNotEmpty()
  name: string;

  /** The id of the folder that represents the root of this drive. */
  @IsString()
  @IsNotEmpty()
  rootFolderId: string;

  /**
   * Decodes the provided parameters into a drive entity class.
   *
   * Throws an error if the provided parameters form an invalid drive entity.
   */
  static async fromTransaction(
    txId: string,
    txOwnerAddress: string,
    txTags: EntityTagMap,
    txData: string | ArrayBuffer,
    driveKey: CryptoKey | null = null,
  ): Promise<DriveEntity> {
    const entityTxData = driveKey
      ? await decryptEntityTransactionData<DriveEntityTransactionData>(
          txData as ArrayBuffer,
          txTags,
          driveKey,
        )
      : JSON.parse(txData as string);

    const entity = plainToClass(DriveEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      transactionTimestamp: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.DriveId],
      privacy: txTags[EntityTag.DrivePrivacy],
      authMode: txTags[EntityTag.DriveAuthMode],
    });

    await validateOrReject(entity);

    return entity;
  }

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

    addArFSTagToTx(tx);
    addUnixTimestampTagToTx(tx);

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
