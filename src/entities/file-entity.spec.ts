import { SignatureType } from 'arweave-stream-bundle';
import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { buffer, text } from 'stream/consumers';
import { Cipher, deriveFileKey, EntityTag, FileEntity } from '../../src';
import {
  dataItemTagListToMap,
    getArweaveClient,
    importAesGcmKey,
    MOCK_OWNER,
    txTagListToMap
} from '../../test/utils';

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
          txTagListToMap(tx.tags),
          tx.data,
        ),
      ).resolves.toBeInstanceOf(FileEntity);
    });

    test('can decode private entity into class', async () => {
      const tx = await arweave.transactions.get(
        'uhUfaoRRu6wTjW9cK0afmihE721smhCTXUdXG3BpnVU',
      );
      const tagMap = txTagListToMap(tx.tags);

      const driveKey = await importAesGcmKey(
        b64UrlToBuffer('eY6xT7D2St-rDW7V-mUyvzEREhOpt4innaEDtcWeZqU'),
      );
      const fileKey = await deriveFileKey(driveKey, tagMap[EntityTag.FileId]!);

      await expect(
        FileEntity.fromTransaction(
          tx.id,
          await arweave.wallets.ownerToAddress(tx.owner),
          tagMap,
          tx.data,
          fileKey,
        ),
      ).resolves.toBeInstanceOf(FileEntity);
    });
  });

  describe('creation', () => {
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

    const testDriveKeyBytes = b64UrlToBuffer(
      'eY6xT7D2St-rDW7V-mUyvzEREhOpt4innaEDtcWeZqU',
    );

    describe('asTransaction()', () => {
      test('can properly create public transaction', async () => {
        entity.createdAt = entity.lastModifiedDate = new Date();

        const tx = await entity.asTransaction(arweave, {
          owner: 'mock_owner',
        });

        await expect(
          FileEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            txTagListToMap(tx.tags),
            tx.data,
          ),
        ).resolves.toMatchObject(entity);
      });

      test('can properly create private transaction', async () => {
        entity.createdAt = entity.lastModifiedDate = new Date();
        const testDriveKey = await importAesGcmKey(testDriveKeyBytes);
        const testFileKey = await deriveFileKey(testDriveKey, entity.id);

        const tx = await entity.asTransaction(
          arweave,
          {
            owner: 'mock_owner',
          },
          Cipher.AES256GCM,
          testFileKey,
        );

        await expect(
          FileEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            txTagListToMap(tx.tags),
            tx.data,
            testFileKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });

    describe('asDataItem()', () => {
      test('can properly create public data item', async () => {
        entity.createdAt = new Date();

        const item = await entity.asDataItem({
          owner: Buffer.from('mock_owner', 'base64url'),
        });

        const jwk = await import('../../test/fixtures/test-key.json');
        await item.header.sign(SignatureType.PS256_65537, jwk, item.dataStreamer());

        await expect(
          FileEntity.fromTransaction(
            item.header.id!,
            await arweave.wallets.ownerToAddress(
              Buffer.from(item.header.owner).toString('base64url'),
            ),
            dataItemTagListToMap(item.header.tags),
            await text(item.dataStreamer() as any),
          ),
        ).resolves.toMatchObject(entity);
      });

      test('can properly create private data item', async () => {
        entity.createdAt = new Date();
        const testDriveKey = await importAesGcmKey(testDriveKeyBytes);
        const testFileKey = await deriveFileKey(testDriveKey, entity.id);

        const item = await entity.asDataItem(
          {
            owner: MOCK_OWNER,
          },
          Cipher.AES256GCM,
          testFileKey,
        );

        const jwk = await import('../../test/fixtures/test-key.json');
        await item.header.sign(SignatureType.PS256_65537, jwk, item.dataStreamer());

        await expect(
          FileEntity.fromTransaction(
            item.header.id!,
            await arweave.wallets.ownerToAddress(
              Buffer.from(item.header.owner).toString('base64url'),
            ),
            dataItemTagListToMap(item.header.tags),
            await buffer(item.dataStreamer() as any),
            testFileKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });
  });
});
