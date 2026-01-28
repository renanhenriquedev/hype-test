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

jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('ConversionService', () => {
  const refUpdate = jest.fn();

  const ref: any = {
    get: jest.fn(),
    update: refUpdate,
  };

  const firestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ref),
    })),
  };

  const download = jest.fn();
  const upload = jest.fn();

  const storage = {
    bucket: jest.fn((bucketName?: string) => ({
      name: bucketName ?? 'default-bucket',
      file: jest.fn(() => ({ download })),
      upload,
    })),
  };

  const firebase = { firestore, storage } as any as FirebaseService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não faz nada se doc não existe', async () => {
    ref.get.mockResolvedValue({ exists: false });

    const svc = new ConversionService(firebase);
    await (svc as any).convert('v1');

    expect(refUpdate).not.toHaveBeenCalled();
  });

  it('não faz nada se status não é PROCESSING', async () => {
    ref.get.mockResolvedValue({ exists: true, data: () => ({ status: 'UPLOADED' }) });

    const svc = new ConversionService(firebase);
    await (svc as any).convert('v1');

    expect(refUpdate).not.toHaveBeenCalled();
  });

  it('marca FAILED se faltarem bucket/path/uid', async () => {
    ref.get.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'PROCESSING', input: { bucket: '', path: '' }, uid: null }),
    });

    const svc = new ConversionService(firebase);
    await (svc as any).convert('v1');

    expect(refUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorMessage: 'Missing input bucket/path/uid',
      }),
    );
  });

  it('fluxo feliz: download -> runFfmpeg -> upload -> DONE', async () => {
    ref.get.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'PROCESSING',
        uid: 'u1',
        input: { bucket: 'in-bucket', path: 'in/path.mp4' },
      }),
    });

    download.mockResolvedValue(undefined);
    upload.mockResolvedValue(undefined);

    const svc = new ConversionService(firebase);

    jest.spyOn(svc as any, 'runFfmpeg').mockResolvedValue(undefined);

    await (svc as any).convert('v1');

    expect(storage.bucket).toHaveBeenCalledWith('in-bucket');
    expect(download).toHaveBeenCalled();

    expect(storage.bucket).toHaveBeenCalledWith();
    expect(upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        destination: 'users/u1/videos/v1/output/converted.mp4',
        contentType: 'video/mp4',
      }),
    );

    expect(refUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DONE',
        output: { bucket: 'default-bucket', path: 'users/u1/videos/v1/output/converted.mp4' },
      }),
    );
  });

  it('marca FAILED se upload/download/ffmpeg falhar', async () => {
    ref.get.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'PROCESSING',
        uid: 'u1',
        input: { bucket: 'in-bucket', path: 'in/path.mp4' },
      }),
    });

    download.mockRejectedValue(new Error('download failed'));

    const svc = new ConversionService(firebase);
    await (svc as any).convert('v1');

    expect(refUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorMessage: expect.stringContaining('download failed'),
      }),
    );
  });

  it('runFfmpeg rejeita se código de saída não é 0', async () => {
    const svc = new ConversionService(firebase);
    
    const { spawn } = require('child_process');
    const mockFfmpeg = {
      stderr: {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(Buffer.from('ffmpeg error output'));
          }
        }),
      },
      on: jest.fn((event, handler) => {
        if (event === 'close') {
          handler(1);
        }
      }),
    };
    
    spawn.mockReturnValue(mockFfmpeg);

    await expect((svc as any).runFfmpeg('/in.mp4', '/out.mp4')).rejects.toThrow('ffmpeg exit code 1');
  });

  it('runFfmpeg rejeita se spawn falhar', async () => {
    const svc = new ConversionService(firebase);
    
    const { spawn } = require('child_process');
    const mockFfmpeg = {
      stderr: { on: jest.fn() },
      on: jest.fn((event, handler) => {
        if (event === 'error') {
          handler(new Error('spawn failed'));
        }
      }),
    };
    
    spawn.mockReturnValue(mockFfmpeg);

    await expect((svc as any).runFfmpeg('/in.mp4', '/out.mp4')).rejects.toThrow('ffmpeg spawn error: spawn failed');
  });

  it('runFfmpeg resolve quando código de saída é 0', async () => {
    const svc = new ConversionService(firebase);
    
    const { spawn } = require('child_process');
    const mockFfmpeg = {
      stderr: { on: jest.fn() },
      on: jest.fn((event, handler) => {
        if (event === 'close') {
          handler(0);
        }
      }),
    };
    
    spawn.mockReturnValue(mockFfmpeg);

    await expect((svc as any).runFfmpeg('/in.mp4', '/out.mp4')).resolves.toBeUndefined();
  });
});
