import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { DriveEntity, DrivePrivacy } from '../../src';
import { getArweaveClient, importAesGcmKey, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('DriveEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode public entity into class', async () => {
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

    test('can decode private entity into class', async () => {
      const tx = await arweave.transactions.get(
        'YglbTBLvYpHjg1M-nlIz3FUqvLXIg39s05oQvotpncM',
      );

      await expect(
        DriveEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
          await importAesGcmKey(
            b64UrlToBuffer('K7jsNncKDgDBi_1xnNi9tigst4jQKeaBxrb0GAZMRYA'),
          ),
        ),
      ).resolves.toBeInstanceOf(DriveEntity);
    });

    test('default privacy to be public', async () => {
      const tx = await arweave.transactions.get(
        '8dcmQgA9JxpLO3J03A3zzxndg19KqVwuL29LN-tmO_8',
      );

      const entity = await DriveEntity.fromTransaction(
        tx.id,
        await arweave.wallets.ownerToAddress(tx.owner),
        tagListToMap(tx.tags),
        tx.data,
      );

      expect(entity.privacy).toBe(DrivePrivacy.Public);
    });
  });
});
