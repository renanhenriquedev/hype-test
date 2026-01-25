import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ConversionService } from './conversion.service';
import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';


type VideoStatus = 'UPLOADED' | 'PROCESSING' | 'DONE' | 'FAILED';

@Injectable()
export class VideosService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly conversion: ConversionService,
  ) {}

  async createUpload(uid: string, file: Express.Multer.File) {
    const videoId = randomUUID();

    const bucket = this.firebase.storage.bucket();
    const inputPath = `users/${uid}/videos/${videoId}/input/${file.originalname}`;

    const storageFile = bucket.file(inputPath);
    await storageFile.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
      metadata: {
        firebaseStorageDownloadTokens: randomUUID(),
      },
    });

    const doc = {
      uid,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,

      preset: 'MP4_720P',

      status: 'UPLOADED' as VideoStatus,
      input: {
        bucket: bucket.name,
        path: inputPath,
      },

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.firebase.firestore.collection('videos').doc(videoId).set(doc);

    return { videoId, status: doc.status };
  }

  async getVideo(uid: string, videoId: string) {
    const ref = this.firebase.firestore.collection('videos').doc(videoId);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new NotFoundException('Video job not found');
    }

    const data = snap.data() as any;

    if (data.uid !== uid) {
      throw new ForbiddenException('You do not have access to this video');
    }

    const toIso = (v: any) =>
      v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v ?? null;

    return {
      videoId,
      status: data.status as VideoStatus,

      preset: data.preset ?? 'MP4_720P',
      originalFilename: data.originalFilename ?? null,
      contentType: data.contentType ?? null,
      sizeBytes: data.sizeBytes ?? null,

      input: data.input ?? null,
      output: data.output ?? null,

      errorMessage: data.errorMessage ?? null,

      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      processingStartedAt: toIso(data.processingStartedAt),
      finishedAt: toIso(data.finishedAt),
    };
  }

  async requestConvert(uid: string, videoId: string) {
    const ref = this.firebase.firestore.collection('videos').doc(videoId);

    const result = await this.firebase.firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new NotFoundException('Video job not found');

      const data = snap.data() as any;

      if (data.uid !== uid) throw new ForbiddenException('No access to this video');

      const status = data.status as string;

      // idempotência
      if (status === 'DONE') return { status: 'DONE', shouldStart: false };
      if (status === 'PROCESSING') return { status: 'PROCESSING', shouldStart: false };

      // permite reprocessar se FAILED ou iniciar se UPLOADED
      if (status !== 'UPLOADED' && status !== 'FAILED') {
        throw new ConflictException(`Cannot convert from status ${status}`);
      }

      tx.update(ref, {
        status: 'PROCESSING',
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        errorMessage: admin.firestore.FieldValue.delete(),
      });

      return { status: 'PROCESSING', shouldStart: true };
    });

    if (result.shouldStart) {
      this.conversion.start(videoId);
    }

    return { videoId, status: result.status };
  }

  async getDownloadUrl(uid: string, videoId: string) {
    const ref = this.firebase.firestore.collection('videos').doc(videoId);
    const snap = await ref.get();

    if (!snap.exists) throw new NotFoundException('Video job not found');

    const data = snap.data() as any;

    if (data.uid !== uid) {
      throw new ForbiddenException('You do not have access to this video');
    }

    if (data.status !== 'DONE') {
      throw new ConflictException('Video is not ready for download');
    }

    const outputPath = data.output?.path;
    const outputBucket = data.output?.bucket;

    if (!outputPath || !outputBucket) {
      throw new ConflictException('Output file not found for this job');
    }

    const bucket = this.firebase.storage.bucket(outputBucket);
    const file = bucket.file(outputPath);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: expiresAt,
      responseDisposition: 'attachment; filename="converted.mp4"',
    });

    return { url, expiresAt: expiresAt.toISOString() };
  }

  async listVideos(uid: string, status?: string) {
    const ALLOWED = new Set(['UPLOADED', 'PROCESSING', 'DONE', 'FAILED']);

    if (status && !ALLOWED.has(status)) {
      throw new Error('Invalid status filter');
    }

    let q = this.firebase.firestore
      .collection('videos')
      .where('uid', '==', uid);

    if (status) {
      q = q.where('status', '==', status);
    }

    q = q
      .orderBy('createdAt', 'desc')
      .limit(50);

    const qs = await q.get();

    const toIso = (v: any) =>
      v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v ?? null;

    return qs.docs.map((d) => {
      const data = d.data() as any;
      return {
        videoId: d.id,
        status: data.status,
        originalFilename: data.originalFilename ?? null,
        sizeBytes: data.sizeBytes ?? null,
        createdAt: toIso(data.createdAt),
        finishedAt: toIso(data.finishedAt),
        errorMessage: data.errorMessage ?? null,
      };
    });
  }


}
