import { DriveEntity } from '../../src';
import { getArweaveClient, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('DriveEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode into class', async () => {
      const tx = await arweave.transactions.get(
        '0r8phv2OZDCNO69qQ6QO3jVJYoYPL2en_vUoWjxXz20',
      );

      await expect(
        DriveEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
        ),
      ).resolves.toBeInstanceOf(DriveEntity);
    });
  });
});
