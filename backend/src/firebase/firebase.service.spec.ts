import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from './firebase.service';
import { ConfigService } from '@nestjs/config';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(() => ({})),
  app: jest.fn(() => ({})),
  auth: jest.fn(() => ({})),
  firestore: jest.fn(() => ({})),
  storage: jest.fn(() => ({})),
  credential: {
    cert: jest.fn(() => ({})),
  },
}));

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const envVars = {
          FIREBASE_PROJECT_ID: 'test-project',
          FIREBASE_CLIENT_EMAIL: 'test@test.com',
          FIREBASE_PRIVATE_KEY: 'test-key',
          FIREBASE_STORAGE_BUCKET: 'test-bucket',
        };
        return envVars[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
