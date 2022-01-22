import { SignatureType } from 'arweave-stream-bundle';
import { b64UrlToBuffer } from 'arweave/node/lib/utils';
import { buffer, text } from 'stream/consumers';
import { Cipher, DriveEntity, DrivePrivacy } from '..';
import {
  dataItemTagListToMap,
  getArweaveClient,
  importAesGcmKey,
  MOCK_OWNER,
  rawOwnerBytesToB64UrlAddress,
  txTagListToMap
} from '../../test/utils';

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
          txTagListToMap(tx.tags),
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
          txTagListToMap(tx.tags),
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
        txTagListToMap(tx.tags),
        tx.data,
      );

      expect(entity.privacy).toBe(DrivePrivacy.Public);
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

    const entity = new DriveEntity({
      id: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
      name: 'mock_drive',
      privacy: DrivePrivacy.Public,
      authMode: undefined,
      rootFolderId: '225f09b7-84c0-495f-b4e6-1c775a6976d0',
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
          DriveEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            txTagListToMap(tx.tags),
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
          DriveEntity.fromTransaction(
            tx.id,
            await arweave.wallets.ownerToAddress(tx.owner),
            txTagListToMap(tx.tags),
            tx.data,
            testDriveKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });

    describe('asDataItem()', () => {
      test('can properly create public data item', async () => {
        entity.createdAt = new Date();

        const item = await entity.asDataItem({
          owner: MOCK_OWNER,
        });

        const jwk = await import('../../test/fixtures/test-key.json');
        await item.header.sign(SignatureType.PS256_65537, jwk, item.dataStreamer());

        await expect(
          DriveEntity.fromTransaction(
            item.header.id!,
            await rawOwnerBytesToB64UrlAddress(item.header.owner),
            dataItemTagListToMap(item.header.tags),
            await text(item.dataStreamer() as any),
          ),
        ).resolves.toMatchObject(entity);
      });

      test('can properly create private data item', async () => {
        entity.createdAt = new Date();
        const testDriveKey = await importAesGcmKey(testDriveKeyBytes);

        const item = await entity.asDataItem(
          {
            owner: MOCK_OWNER,
          },
          Cipher.AES256GCM,
          testDriveKey,
        );

        const jwk = await import('../../test/fixtures/test-key.json');
        await item.header.sign(SignatureType.PS256_65537, jwk, item.dataStreamer());

        await expect(
          DriveEntity.fromTransaction(
            item.header.id!,
            await rawOwnerBytesToB64UrlAddress(item.header.owner),
            dataItemTagListToMap(item.header.tags),
            await buffer(item.dataStreamer() as any),
            testDriveKey,
          ),
        ).resolves.toMatchObject(entity);
      });
    });
  });
});
