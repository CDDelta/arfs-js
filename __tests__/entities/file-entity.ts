import { FileEntity } from '../../src';
import { getArweaveClient, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('FileEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode into class', async () => {
      const tx = await arweave.transactions.get(
        '2NgclyVCmuEQeFPTAjPSMjNk6WpFHr7UGARPjVa6owQ',
      );

      await expect(
        FileEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
        ),
      ).resolves.toBeInstanceOf(FileEntity);
    });
  });
});
