import { b64UrlToBuffer, b64UrlToString } from 'arweave/node/lib/utils';
import { Cipher, FolderEntity } from '../../src';
import {
  getArweaveBundler,
  getArweaveClient,
  importAesGcmKey,
  tagListToMap,
} from '../utils';

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

  describe('creation', () => {
    beforeAll(() => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date('20 Aug 2020 00:12:00 GMT').getTime());
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    const entity = new FolderEntity({
      id: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      driveId: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      name: 'mock_drive',
      parentFolderId: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      // Date here needs to be redefined in tests to use the fake timer.
      createdAt: new Date(),
    });

    const testDriveKeyBytes = b64UrlToBuffer(
      'K7jsNncKDgDBi_1xnNi9tigst4jQKeaBxrb0GAZMRYA',
    );

    describe('asTransaction()', () => {
      test('can properly create public transaction', async () => {
        entity.createdAt = new Date();

        const tx = await entity.asTransaction(arweave, {
          owner: 'mock_owner',
        });

        await expect(
          FolderEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            tagListToMap(tx.tags),
            tx.data,
          ),
        ).resolves.toMatchObject(entity);
      });

      test('can properly create private transaction', async () => {
        entity.createdAt = new Date();
        const testDriveKey = await importAesGcmKey(testDriveKeyBytes);

        const tx = await entity.asTransaction(
          arweave,
          {
            owner: 'mock_owner',
          },
          Cipher.AES256GCM,
          testDriveKey,
        );

        await expect(
          FolderEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            tagListToMap(tx.tags),
            tx.data,
            testDriveKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });

    describe('asDataItem()', () => {
      const bundler = getArweaveBundler();

      test('can properly create public data item', async () => {
        entity.createdAt = new Date();

        const item = await entity.asDataItem(bundler, {
          owner: 'mock_owner',
        });

        await expect(
          FolderEntity.fromTransaction(
            item.id,
            await arweave.wallets.ownerToAddress(item.owner),
            tagListToMap(item.tags),
            b64UrlToString(item.data),
          ),
        ).resolves.toMatchObject(entity);
      });

      test('can properly create private data item', async () => {
        entity.createdAt = new Date();
        const testDriveKey = await importAesGcmKey(testDriveKeyBytes);

        const item = await entity.asDataItem(
          bundler,
          {
            owner: 'mock_owner',
          },
          Cipher.AES256GCM,
          testDriveKey,
        );

        await expect(
          FolderEntity.fromTransaction(
            item.id,
            await arweave.wallets.ownerToAddress(item.owner),
            tagListToMap(item.tags),
            b64UrlToBuffer(item.data),
            testDriveKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });
  });
});
