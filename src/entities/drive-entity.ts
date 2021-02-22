import { Exclude, plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  validateOrReject,
} from 'class-validator';
import { decryptEntityTransactionData } from '../crypto';
import {
  arfsVersion,
  coerceToUtf8,
  formatTxUnixTime,
  parseUnixTimeTagToDate,
} from '../utils';
import { Entity } from './entity';
import {
  DriveAuthMode,
  DrivePrivacy,
  EntityTag,
  EntityTagMap,
  EntityType,
} from './tags';

export class DriveEntity
  extends Entity<DriveEntity>
  implements DriveEntityTransactionData {
  /**
   * The unique, persistent id of this drive.
   *
   * Extracted from the drive entity transaction's `Drive-Id` tag.
   */
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Exclude({ toPlainOnly: true })
  id: string;

  /**
   * Whether or not this drive is public or private.
   *
   * Extracted from the drive entity transaction's `Drive-Privacy` tag.
   */
  @IsEnum(DrivePrivacy)
  @Exclude({ toPlainOnly: true })
  privacy: DrivePrivacy;

  /**
   * The mode of authentication for this drive. `undefined` if the drive
   * is public.
   *
   * Extracted from the drive entity transaction's `Drive-Auth-Mode` tag.
   */
  @IsOptional()
  @IsEnum(DriveAuthMode)
  @Exclude({ toPlainOnly: true })
  authMode?: DriveAuthMode;

  @IsString()
  @IsNotEmpty()
  name: string;

  /** The id of the folder that represents the root of this drive. */
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  rootFolderId: string;

  /**
   * Decodes the provided parameters into a drive entity class.
   *
   * Throws an error if the provided parameters form an invalid drive entity.
   *
   * @param txData expected to be JSON if the entity is public,
   * of type `ArrayBuffer` if the entity is private/encrypted.
   */
  static async fromTransaction(
    txId: string,
    txOwnerAddress: string,
    txTags: EntityTagMap,
    txData: string | ArrayBuffer,
    driveKey?: CryptoKey,
  ): Promise<DriveEntity> {
    const entityTxData = driveKey
      ? await decryptEntityTransactionData<DriveEntityTransactionData>(
          txData as ArrayBuffer,
          txTags,
          driveKey,
        )
      : JSON.parse(coerceToUtf8(txData));

    const entity = plainToClass(DriveEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      transactionTags: txTags,
      createdAt: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.DriveId],
      privacy: txTags[EntityTag.DrivePrivacy] || DrivePrivacy.Public,
      authMode: txTags[EntityTag.DriveAuthMode],
    });

    await validateOrReject(entity);

    return entity;
  }

  protected getEntityTransactionTags(): EntityTagMap {
    const tags: EntityTagMap = {
      ArFS: arfsVersion,
      'Unix-Time': formatTxUnixTime(this.createdAt),
      'Entity-Type': EntityType.Drive,
      'Drive-Id': this.id,
      'Drive-Privacy': this.privacy,
    };

    tags['Drive-Auth-Mode'] ||= this.authMode;

    return tags;
  }
}

export interface DriveEntityTransactionData {
  name: string;

  /** The id of the folder that represents the root of this drive. */
  rootFolderId: string;
}
