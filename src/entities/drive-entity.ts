import { Entity } from "./entity";

export interface DriveEntityTransactionData {
  name: string;
  rootFolderId: string;
}

export interface DriveEntity extends Entity, DriveEntityTransactionData {
  id: string;
  privacy: string;
  authMode: string;
}
