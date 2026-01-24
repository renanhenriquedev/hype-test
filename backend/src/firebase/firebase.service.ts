import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  public readonly app: admin.app.App;
  public readonly auth: admin.auth.Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly storage: admin.storage.Storage;

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');
    const storageBucket = this.config.get<string>('FIREBASE_STORAGE_BUCKET');

    if (!projectId || !clientEmail || !privateKeyRaw || !storageBucket) {
      throw new Error('Missing Firebase env vars');
    }

    // Importante: private key vem com \n no .env
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');    

    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
    } else {
      this.app = admin.app();
    }

    this.auth = admin.auth(this.app);
    this.firestore = admin.firestore(this.app);
    this.storage = admin.storage(this.app);
  }
}
