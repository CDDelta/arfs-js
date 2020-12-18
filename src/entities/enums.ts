export enum EntityTag {
  UnixTime = "Unix-Time",

  ArFS = "ArFS",
  EntityType = "Entity-Type",

  DriveId = "Drive-Id",
  FolderId = "Folder-Id",
  ParentFolderId = "Parent-Folder-Id",
  FileId = "File-Id",

  DrivePrivacy = "Drive-Privacy",
  DriveAuthMode = "Drive-Auth-Mode",

  Cipher = "Cipher",
  CipherIV = "Cipher-IV",
}

export enum EntityType {
  Drive = "drive",
  Folder = "folder",
  File = "file",
}

export enum Cipher {
  AES256GCM = "AES256-GCM",
}

export enum DrivePrivacy {
  Public = "public",
  Private = "private",
}

export enum DriveAuthMode {
  Password = "password",
}
