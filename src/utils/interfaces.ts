import ArweaveBundles from 'arweave-bundles';

/**
 * A minimal interface for ArFS transaction uses.
 */
export interface Transaction {
  id: string;
  owner: string;
  tags: { name: string; value: string }[];
  data: Uint8Array;
  addTag(name: string, value: string): void;
}

/**
 * Attributes for configuring a transaction.
 */
export interface TransactionAttributes {
  owner: string;
  target?: string;
  quantity?: string;
  reward?: string;
}

/**
 * A bundler for creating ANS-102 data bundles.
 */
export interface ArweaveBundler extends ReturnType<typeof ArweaveBundles> {}

/**
 * Attributes for a configuring a data item.
 */
export interface DataItemAttributes {
  owner: string;
  target?: string;
  nonce?: string;
}
