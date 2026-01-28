import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { ConversionService } from './conversion.service';
import { FirebaseService } from '../firebase/firebase.service';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  app: jest.fn(),
  credential: { cert: jest.fn() },
  auth: jest.fn(),
  firestore: Object.assign(jest.fn(), { 
    FieldValue: {
      serverTimestamp: jest.fn(() => ({ __type: 'serverTimestamp' })),
      delete: jest.fn(() => ({ __type: 'delete' })),
    }
  }),
  storage: jest.fn(),
}));

import * as admin from 'firebase-admin';

jest.mock('crypto', () => ({ randomUUID: jest.fn(() => 'uuid-1') }));

describe('VideosService', () => {
  let service: VideosService;

  const save = jest.fn();
  const getSignedUrl = jest.fn();

  const file = jest.fn(() => ({ save, getSignedUrl }));
  const upload = jest.fn();

  const bucket = jest.fn((bucketName?: string) => ({
    name: bucketName ?? 'bucket-default',
    file,
    upload,
  }));

  const docGet = jest.fn();
  const docSet = jest.fn();
  const docUpdate = jest.fn();

  const doc = jest.fn(() => ({
    get: docGet,
    set: docSet,
    update: docUpdate,
  }));

  const queryGet = jest.fn();
  const query: any = {
    where: jest.fn(() => query),
    orderBy: jest.fn(() => query),
    limit: jest.fn(() => query),
    get: queryGet,
  };

  const collection = jest.fn(() => ({
    doc,
    where: jest.fn(() => query),
  }));

  const runTransaction = jest.fn();

  const firebase = {
    storage: { bucket },
    firestore: { collection, runTransaction },
  } as any as FirebaseService;

  const conversion = { start: jest.fn() } as any as ConversionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: FirebaseService, useValue: firebase },
        { provide: ConversionService, useValue: conversion },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  describe('createUpload', () => {
    it('faz upload pro bucket e cria doc no Firestore', async () => {
      save.mockResolvedValue(undefined);
      docSet.mockResolvedValue(undefined);

      const res = await service.createUpload('u1', {
        originalname: 'x.mp4',
        mimetype: 'video/mp4',
        size: 10,
        buffer: Buffer.from('abc'),
      } as any);

      expect(res).toEqual({ videoId: 'uuid-1', status: 'UPLOADED' });

      expect(bucket).toHaveBeenCalledWith();
      expect(file).toHaveBeenCalledWith('users/u1/videos/uuid-1/input/x.mp4');
      expect(save).toHaveBeenCalledWith(Buffer.from('abc'), expect.any(Object));
      expect(docSet).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'u1',
          status: 'UPLOADED',
          input: {
            bucket: 'bucket-default',
            path: 'users/u1/videos/uuid-1/input/x.mp4',
          },
        }),
      );
    });
  });

  describe('getVideo', () => {
    it('404 se não existe', async () => {
      docGet.mockResolvedValue({ exists: false });
      await expect(service.getVideo('u1', 'v1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('403 se uid não bate', async () => {
      docGet.mockResolvedValue({
        exists: true,
        data: () => ({ uid: 'other', status: 'UPLOADED' }),
      });
      await expect(service.getVideo('u1', 'v1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna shape normalizado com datas em ISO quando possível', async () => {
      const ts = { toDate: () => new Date('2020-01-01T00:00:00.000Z') };
      docGet.mockResolvedValue({
        exists: true,
        data: () => ({
          uid: 'u1',
          status: 'DONE',
          createdAt: ts,
          updatedAt: ts,
          finishedAt: ts,
          output: { bucket: 'b', path: 'p' },
        }),
      });

      const res = await service.getVideo('u1', 'v1');
      expect(res).toEqual(
        expect.objectContaining({
          videoId: 'v1',
          status: 'DONE',
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
          finishedAt: '2020-01-01T00:00:00.000Z',
        }),
      );
    });
  });

  describe('requestConvert', () => {
    it('transição UPLOADED -> PROCESSING e dispara conversion.start', async () => {
      runTransaction.mockImplementation(async (fn: any) => {
        const tx = {
          get: async () => ({
            exists: true,
            data: () => ({ uid: 'u1', status: 'UPLOADED' }),
          }),
          update: jest.fn(),
        };
        return fn(tx);
      });

      const res = await service.requestConvert('u1', 'v1');
      expect(res).toEqual({ videoId: 'v1', status: 'PROCESSING' });
      expect(conversion.start).toHaveBeenCalledWith('v1');
    });

    it('idempotente: se já PROCESSING não dispara de novo', async () => {
      runTransaction.mockImplementation(async (fn: any) => {
        const tx = {
          get: async () => ({
            exists: true,
            data: () => ({ uid: 'u1', status: 'PROCESSING' }),
          }),
          update: jest.fn(),
        };
        return fn(tx);
      });

      const res = await service.requestConvert('u1', 'v1');
      expect(res).toEqual({ videoId: 'v1', status: 'PROCESSING' });
      expect(conversion.start).not.toHaveBeenCalled();
    });

    it('403 se uid não bate', async () => {
      runTransaction.mockImplementation(async (fn: any) => {
        const tx = {
          get: async () => ({
            exists: true,
            data: () => ({ uid: 'other', status: 'UPLOADED' }),
          }),
          update: jest.fn(),
        };
        return fn(tx);
      });

      await expect(service.requestConvert('u1', 'v1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('409 se status não é UPLOADED/FAILED/DONE/PROCESSING', async () => {
      runTransaction.mockImplementation(async (fn: any) => {
        const tx = {
          get: async () => ({
            exists: true,
            data: () => ({ uid: 'u1', status: 'WEIRD' }),
          }),
          update: jest.fn(),
        };
        return fn(tx);
      });

      await expect(service.requestConvert('u1', 'v1')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getDownloadUrl', () => {
    it('409 se não está DONE', async () => {
      docGet.mockResolvedValue({
        exists: true,
        data: () => ({ uid: 'u1', status: 'PROCESSING' }),
      });

      await expect(service.getDownloadUrl('u1', 'v1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('retorna signed url se DONE', async () => {
      docGet.mockResolvedValue({
        exists: true,
        data: () => ({
          uid: 'u1',
          status: 'DONE',
          output: { bucket: 'bucket-out', path: 'out/file.mp4' },
        }),
      });

      getSignedUrl.mockResolvedValue(['https://signed-url']);

      const res = await service.getDownloadUrl('u1', 'v1');

      expect(bucket).toHaveBeenCalledWith('bucket-out');
      expect(file).toHaveBeenCalledWith('out/file.mp4');
      expect(getSignedUrl).toHaveBeenCalled();

      expect(res.url).toBe('https://signed-url');
      expect(typeof res.expiresAt).toBe('string');
    });
  });

  describe('listVideos', () => {
    it('filtra por uid e status quando status é permitido', async () => {
      queryGet.mockResolvedValue({
        docs: [
          { id: 'v1', data: () => ({ status: 'DONE', originalFilename: 'a', sizeBytes: 1 }) },
        ],
      });

      const res = await service.listVideos('u1', 'DONE');
      expect(res).toHaveLength(1);
      expect(query.where).toHaveBeenCalled();
    });

    it('lança erro em status inválido (comportamento atual)', async () => {
      await expect(service.listVideos('u1', 'INVALID')).rejects.toThrow('Invalid status filter');
    });
  });
});
