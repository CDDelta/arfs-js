import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { Cipher, FileEntity } from 'src';
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

  describe('asTransaction()', () => {
    beforeAll(() => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date('20 Aug 2020 00:12:00 GMT').getTime());
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    const entity = new FileEntity({
      id: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      driveId: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      name: 'mock_file',
      size: 12,
      parentFolderId: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      dataTxId: 'mock_tx_id',
      dataContentType: 'application/json',
      // Dates here needs to be redefined in tests to use the fake timer.
      lastModifiedDate: new Date(),
      createdAt: new Date(),
    });

    test('can properly create public transaction', async () => {
      entity.createdAt = entity.lastModifiedDate = new Date();

      const tx = await entity.asTransaction(arweave, {
        owner: 'mock_owner',
      });

      await expect(
        FileEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
        ),
      ).resolves.toMatchObject(entity);
    });

    test('can properly create private transaction', async () => {
      entity.createdAt = entity.lastModifiedDate = new Date();

      const driveKey = await importAesGcmKey(
        b64UrlToBuffer('eY6xT7D2St-rDW7V-mUyvzEREhOpt4innaEDtcWeZqU'),
      );

      const tx = await entity.asTransaction(
        arweave,
        {
          owner: 'mock_owner',
        },
        Cipher.AES256GCM,
        driveKey,
      );

      await expect(
        FileEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagListToMap(tx.tags),
          tx.data,
          driveKey,
        ),
      ).resolves.toMatchObject(entity);
    });
  });
});
