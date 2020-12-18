import { Entity } from "./entity";

export interface FolderEntityTransactionData {
  name: string;
}

export interface FolderEntity extends Entity, FolderEntityTransactionData {
  id: string;
  driveId: string;
  parentFolderId: string;
}
