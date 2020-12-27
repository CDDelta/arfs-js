import { FolderEntity } from '../../src';
import { getArweaveClient, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('FolderEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode into class', async () => {
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
  });
});
