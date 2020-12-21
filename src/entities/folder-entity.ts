import { Exclude, plainToClass } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  validateOrReject,
} from 'class-validator';
import Arweave from 'arweave';
import {
  Transaction,
  addTagsToTx,
  EntityTagMap,
  createUnencryptedEntityDataTransaction,
  addArFSTagToTx,
  addUnixTimestampTagToTx,
  parseUnixTimeTagToDate,
} from '../utils';
import { Entity } from './entity';
import { EntityType, Cipher, EntityTag } from './enums';
import {
  createEncryptedEntityTransaction,
  decryptEntityTransactionData,
} from '../crypto';
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
  @IsUUID()
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

  constructor(properties: Omit<FolderEntity, keyof Entity>, validate = true) {
    super();

    // Workaround for class-transformer using the constructor.
    if (!properties) {
      return;
    }

    this.id = properties.id;
    this.driveId = properties.driveId;
    this.parentFolderId = properties.parentFolderId;
    this.name = properties.name;

    if (validate) {
      validateOrReject(this);
    }
  }

  /**
   * Decodes the provided parameters into a folder entity class.
   *
   * Throws an error if the provided parameters form an invalid folder entity.
   *
   * @param txData expected to be of type `string` if the entity is unencrypted, `ArrayBuffer` if the entity is encrypted.
   */
  static async fromTransaction(
    txId: string,
    txOwnerAddress: string,
    txTags: EntityTagMap,
    txData: string | ArrayBuffer,
    driveKey: CryptoKey | null = null,
  ): Promise<FolderEntity> {
    const entityTxData = driveKey
      ? await decryptEntityTransactionData<FolderEntityTransactionData>(
          txData as ArrayBuffer,
          txTags,
          driveKey,
        )
      : JSON.parse(txData as string);

    const entity = plainToClass(FolderEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      transactionTimestamp: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.FolderId],
      driveId: txTags[EntityTag.DriveId],
      parentFolderId: txTags[EntityTag.ParentFolderId],
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
