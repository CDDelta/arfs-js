import Arweave from 'arweave';
import { TransactionInterface } from 'arweave/node/lib/transaction';
import { Exclude, plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
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
import {
  Cipher,
  DriveAuthMode,
  DrivePrivacy,
  EntityTag,
  EntityType,
} from './enums';

export class DriveEntity extends Entity implements DriveEntityTransactionData {
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
  authMode: DriveAuthMode | undefined;

  @IsString()
  @IsNotEmpty()
  name: string;

  /** The id of the folder that represents the root of this drive. */
  @IsString()
  @IsNotEmpty()
  rootFolderId: string;

  constructor(
    properties: Omit<DriveEntity, keyof Omit<Entity, 'createdAt'>>,
    validate = true,
  ) {
    super();

    // Workaround for class-transformer using the constructor.
    if (!properties) {
      return;
    }

    this.id = properties.id;
    this.privacy = properties.privacy;
    this.authMode = properties.authMode;
    this.name = properties.name;
    this.rootFolderId = properties.rootFolderId;
    this.createdAt = properties.createdAt;

    if (validate) {
      validateOrReject(this);
    }
  }

  /**
   * Decodes the provided parameters into a drive entity class.
   *
   * Throws an error if the provided parameters form an invalid drive entity.
   *
   * @param txData expected to be of type `string` if the entity is unencrypted, `ArrayBuffer` if the entity is encrypted.
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
      : JSON.parse(coerceToUtf8(txData));

    const entity = plainToClass(DriveEntity, {
      ...entityTxData,
      transactionId: txId,
      transactionOwnerAddress: txOwnerAddress,
      createdAt: parseUnixTimeTagToDate(txTags[EntityTag.UnixTime]),
      id: txTags[EntityTag.DriveId],
      privacy: txTags[EntityTag.DrivePrivacy] || DrivePrivacy.Public,
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
    });

    if (this.authMode) {
      addTagsToTx(tx, {
        'Drive-Auth-Mode': this.authMode,
      });
    }

    return tx;
  }
}

export interface DriveEntityTransactionData {
  name: string;

  /** The id of the folder that represents the root of this drive. */
  rootFolderId: string;
}
