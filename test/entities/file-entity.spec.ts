import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { FileEntity } from '../../src';
import { getArweaveClient, importAesGcmKey, tagListToMap } from '../utils';

const arweave = getArweaveClient();

describe('FileEntity', () => {
  describe('fromTransaction()', () => {
    test('can decode public entity into class', async () => {
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

    test('can decode private entity into class', async () => {
      const tx = await arweave.transactions.get(
        'uhUfaoRRu6wTjW9cK0afmihE721smhCTXUdXG3BpnVU',
      );

      await expect(
        FileEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
          await importAesGcmKey(
            b64UrlToBuffer('eY6xT7D2St-rDW7V-mUyvzEREhOpt4innaEDtcWeZqU'),
          ),
        ),
      ).resolves.toBeInstanceOf(FileEntity);
    });
  });
});
