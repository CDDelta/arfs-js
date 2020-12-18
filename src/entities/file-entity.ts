import { Entity } from "./entity";

export interface FileEntityTransactionData {
  name: string;
  size: number;
  lastModifiedDate: Date;

  dataTxId: string;
  dataContentType: string;
}

export interface FileEntity extends Entity, FileEntityTransactionData {
  id: string;
  driveId: string;
  parentFolderId: string;
}
