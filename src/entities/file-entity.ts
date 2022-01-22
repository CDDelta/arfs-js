import { Exclude, plainToClass } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
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
import { EntityTag, EntityTagMap, EntityType } from './tags';

export class FileEntity
  extends Entity<FileEntity>
  implements FileEntityTransactionData {
  /**
   * The unique, persistent id of this file.
   *
   * Extracted from the file entity transaction's `File-Id` tag.
   */
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Exclude({ toPlainOnly: true })
  id: string;

  /**
   * The id of the drive this file is contained in.
   *
   * Extracted from the file entity transaction's `Drive-Id` tag.
   */
  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  driveId: string;

  /**
   * The id of this file's parent folder entity.
   *
   * Never `null` as files should always have a parent.
   * Files at the root folder of a drive should assign the root folder as their parent.
   */
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Exclude({ toPlainOnly: true })
  parentFolderId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  /** The original size of the file before any encoding in bytes. */
  @IsNumber()
  @IsPositive()
  size: number;

  @IsDate()
  lastModifiedDate: Date;

  /**
   * The id of the transaction storing the raw binary data of this file.
   *
   * This can refer to a top-level transaction or data item created using ANS-102.
   */
  @IsString()
  @IsNotEmpty()
  dataTxId: string;

  /**
   * The `Content-Type` of the raw binary data.
   *
   * Should be the same as the `Content-Type` tag on the data transaction for public data.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dataContentType?: string;

  /**
   * Decodes the provided parameters into a file entity class.
   *
   * Throws an error if the provided parameters form an invalid file entity.
   *
   * @param txData expected to be of type `ArrayBuffer` if the entity is encrypted.
   */
  static async fromTransaction(
    txId: string,
    txOwnerAddress: string,
    txTags: EntityTagMap,
    txData: string | ArrayBuffer,
    encryptionKey?: CryptoKey,
  ): Promise<FileEntity> {
    const entityTxData: FileEntityTransactionData = encryptionKey
      ? await decryptEntityTransactionData(
          txData as ArrayBuffer,
          txTags,
          encryptionKey,
        )
      : JSON.parse(coerceToUtf8(txData));

    const entity = plainToClass(FileEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      transactionTags: txTags,
      createdAt: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.FileId],
      driveId: txTags[EntityTag.DriveId],
      parentFolderId: txTags[EntityTag.ParentFolderId],
      lastModifiedDate: new Date(entityTxData.lastModifiedDate),
    });

    await validateOrReject(entity);

    return entity;
  }

  protected getEntityTransactionTags(): EntityTagMap {
    return {
      ArFS: arfsVersion,
      'Unix-Time': formatTxUnixTime(this.createdAt),
      'Entity-Type': EntityType.File,
      'File-Id': this.id,
      'Drive-Id': this.driveId,
      'Parent-Folder-Id': this.parentFolderId,
    };
  }
}

export interface FileEntityTransactionData {
  name: string;
  size: number;
  lastModifiedDate: Date;
  dataTxId: string;
  dataContentType?: string;
}
