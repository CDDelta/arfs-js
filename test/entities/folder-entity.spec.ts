import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { FolderEntity } from '../../src';
import { getArweaveClient, importAesGcmKey, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('FolderEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode public entity into class', async () => {
      const tx = await arweave.transactions.get(
        'EQ3oBdPXe3LNaAdDkaeR11MGPD05S3AtNxpoxLJ1XeM',
      );

      await expect(
        FolderEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
        ),
      ).resolves.toBeInstanceOf(FolderEntity);
    });

    test('can decode private entity into class', async () => {
      const tx = await arweave.transactions.get(
        'aNxRrlQXymIbWddGFDVkkffcKbfQ9vGmyHZMzQ6A4fA',
      );

      await expect(
        FolderEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
          await importAesGcmKey(
            b64UrlToBuffer('K7jsNncKDgDBi_1xnNi9tigst4jQKeaBxrb0GAZMRYA'),
          ),
        ),
      ).resolves.toBeInstanceOf(FolderEntity);
    });
  });
});
