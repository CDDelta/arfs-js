import Arweave from 'arweave';
import { DriveEntity } from '../../src';
import { TextDecoder } from 'util';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

describe('DriveEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode', async () => {
      const tx = await arweave.transactions.get(
        '0r8phv2OZDCNO69qQ6QO3jVJYoYPL2en_vUoWjxXz20',
      );

      const txTagMap = tx.tags.reduce((map, tag) => {
        map[atob(tag.name)] = atob(tag.value);
        return map;
      }, {});

      console.log(
        await DriveEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          txTagMap,
          new TextDecoder().decode(tx.data),
        ),
      );
    });
  });
});
