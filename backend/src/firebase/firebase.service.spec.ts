import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from './firebase.service';
import { ConfigService } from '@nestjs/config';

jest.mock('firebase-admin', () => {
  const apps: any[] = [];
  const mockFieldValue = {
    serverTimestamp: jest.fn(() => ({ __type: 'serverTimestamp' })),
    delete: jest.fn(() => ({ __type: 'delete' })),
  };

  const mockFirestore = Object.assign(
    jest.fn(() => ({
      collection: jest.fn(),
      runTransaction: jest.fn(),
    })),
    { FieldValue: mockFieldValue }
  );

  return {
    apps,
    initializeApp: jest.fn((options: any) => {
      const created = { options };
      apps.push(created);
      return created;
    }),
    app: jest.fn(() => apps[0]),
    credential: {
      cert: jest.fn((x) => x),
    },
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn(),
    })),
    firestore: mockFirestore,
    storage: jest.fn(() => ({
      bucket: jest.fn(),
    })),
  };
});

import * as admin from 'firebase-admin';

describe('FirebaseService', () => {
  const makeConfig = (overrides: Partial<Record<string, string>> = {}) => ({
    get: jest.fn((key: string) => {
      const envVars: Record<string, string | undefined> = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_PRIVATE_KEY: 'line1\\nline2',
        FIREBASE_STORAGE_BUCKET: 'test-bucket',
        ...overrides,
      };
      return envVars[key];
    }),
  });

  beforeEach(() => {
    admin.apps.length = 0;
    (admin.initializeApp as jest.Mock).mockClear();
    (admin.app as jest.Mock).mockClear();
    (admin.credential.cert as jest.Mock).mockClear();
  });

  it('inicializa o firebase-admin com as env vars e converte \\n na private key', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    const service = module.get<FirebaseService>(FirebaseService);
    expect(service).toBeDefined();

    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    expect(admin.credential.cert).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'test-project',
        clientEmail: 'test@test.com',
        privateKey: 'line1\nline2',
      }),
    );
  });

  it('reusa admin.app() se já existir app inicializado', async () => {
    (admin.apps as any[]).push({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    module.get<FirebaseService>(FirebaseService);

    expect(admin.initializeApp).not.toHaveBeenCalled();
    expect(admin.app).toHaveBeenCalled();
  });

  it('lança erro se faltar env vars do firebase', async () => {
    await expect(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FirebaseService,
          { provide: ConfigService, useValue: makeConfig({ FIREBASE_PROJECT_ID: '' }) },
        ],
      }).compile();

      module.get<FirebaseService>(FirebaseService);
    }).rejects.toThrow('Missing Firebase env vars');
  });
});
