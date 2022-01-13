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
