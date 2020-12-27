import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
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
import {
  createEncryptedEntityTransaction,
  decryptEntityTransactionData,
} from '../crypto';
import {
  addArFSTagToTx,
  addTagsToTx,
  addUnixTimestampTagToTx,
  coerceToUtf8,
  createUnencryptedEntityDataTransaction,
  EntityTagMap,
  parseUnixTimeTagToDate,
  Transaction,
} from '../utils';
import { Entity } from './entity';
import { Cipher, EntityTag, EntityType } from './enums';

export class FileEntity extends Entity implements FileEntityTransactionData {
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
   * Should be the same as the `Content-Type` tag on the data transaction.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dataContentType: string;

  constructor(
    properties: Omit<FileEntity, keyof Omit<Entity, 'createdAt'>>,
    validate = true,
  ) {
    super();

    // Workaround for class-transformer using the constructor.
    if (!properties) {
      return;
    }

    this.id = properties.id;
    this.driveId = properties.driveId;
    this.parentFolderId = properties.parentFolderId;
    this.name = properties.name;
    this.size = properties.size;
    this.lastModifiedDate = properties.lastModifiedDate;
    this.dataTxId = properties.dataTxId;
    this.dataContentType = properties.dataContentType;
    this.createdAt = properties.createdAt;

    if (validate) {
      validateOrReject(this);
    }
  }

  /**
   * Decodes the provided parameters into a file entity class.
   *
   * Throws an error if the provided parameters form an invalid file entity.
   *
   * @param txData expected to be of type `string` if the entity is unencrypted, `ArrayBuffer` if the entity is encrypted.
   */
  static async fromTransaction(
    txId: string,
    txOwnerAddress: string,
    txTags: EntityTagMap,
    txData: string | ArrayBuffer,
    driveKey: CryptoKey | null = null,
  ): Promise<FileEntity> {
    const entityTxData: FileEntityTransactionData = driveKey
      ? await decryptEntityTransactionData(
          txData as ArrayBuffer,
          txTags,
          driveKey,
        )
      : JSON.parse(coerceToUtf8(txData));

    const entity = plainToClass(FileEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      transactionTimestamp: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.FileId],
      driveId: txTags[EntityTag.DriveId],
      parentFolderId: txTags[EntityTag.ParentFolderId],
      lastModifiedDate: new Date(entityTxData.lastModifiedDate),
    });

    await validateOrReject(entity);

    return entity;
  }

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

    addArFSTagToTx(tx);
    addUnixTimestampTagToTx(tx);

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
  /**
   * Represented in milliseconds since Unix epoch
   */
  lastModifiedDate: Date;
  dataTxId: string;
  dataContentType: string;
}
