import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ConversionService {
  constructor(private readonly firebase: FirebaseService) {}

  start(videoId: string) {
    void this.convert(videoId).catch(() => {
    });
  }

  private async convert(videoId: string) {
    const ref = this.firebase.firestore.collection('videos').doc(videoId);

    const snap = await ref.get();
    if (!snap.exists) return;

    const data = snap.data() as any;

    if (data.status !== 'PROCESSING') return;

    const inputBucket = data.input?.bucket;
    const inputPath = data.input?.path;
    const uid = data.uid;

    if (!inputBucket || !inputPath || !uid) {
      await ref.update({
        status: 'FAILED',
        errorMessage: 'Missing input bucket/path/uid',
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const tmpDir = os.tmpdir();
    const inFile = path.join(tmpDir, `${videoId}-input`);
    const outFile = path.join(tmpDir, `${videoId}-output.mp4`);

    try {
      await this.firebase.storage.bucket(inputBucket).file(inputPath).download({
        destination: inFile,
      });

      await this.runFfmpeg(inFile, outFile);

      const outputBucket = this.firebase.storage.bucket().name;
      const outputPath = `users/${uid}/videos/${videoId}/output/converted.mp4`;

      await this.firebase.storage.bucket(outputBucket).upload(outFile, {
        destination: outputPath,
        contentType: 'video/mp4',
        resumable: false,
      });

      await ref.update({
        status: 'DONE',
        output: { bucket: outputBucket, path: outputPath },
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        errorMessage: admin.firestore.FieldValue.delete(),
      });
    } catch (err: any) {
      await ref.update({
        status: 'FAILED',
        errorMessage: String(err?.message ?? err),
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } finally {
      await Promise.allSettled([fs.unlink(inFile), fs.unlink(outFile)]);
    }
  }

  private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i',
        inputPath,
        '-vf',
        'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputPath,
      ];

      const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let stderr = '';
      ff.stderr.on('data', (d) => (stderr += d.toString()));

      ff.on('error', (e) => reject(new Error(`ffmpeg spawn error: ${e.message}`)));
      ff.on('close', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`ffmpeg exit code ${code}. ${stderr.slice(-2000)}`));
      });
    });
  }
}
