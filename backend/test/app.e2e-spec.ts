import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FirebaseAuthGuard } from '../src/auth/firebase-auth/firebase-auth.guard';
import { VideosService } from '../src/videos/videos.service';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  const fakeGuard = {
    canActivate: (ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { uid: 'test-user-123', email: 'test@example.com' };
      return true;
    },
  };

  const fakeVideosService = {
    createUpload: jest.fn(async () => ({ videoId: 'video-123', status: 'UPLOADED' })),
    getVideo: jest.fn(async () => ({ 
      videoId: 'video-123', 
      status: 'UPLOADED',
      originalFilename: 'test.mp4',
      contentType: 'video/mp4',
      sizeBytes: 1024,
      preset: 'MP4_720P',
      createdAt: '2026-01-27T00:00:00.000Z',
      updatedAt: '2026-01-27T00:00:00.000Z',
    })),
    requestConvert: jest.fn(async () => ({ videoId: 'video-123', status: 'PROCESSING' })),
    getDownloadUrl: jest.fn(async () => ({ 
      url: 'https://storage.example.com/signed-url', 
      expiresAt: new Date(Date.now() + 3600000).toISOString() 
    })),
    listVideos: jest.fn(async () => [
      { videoId: 'video-123', status: 'UPLOADED' },
      { videoId: 'video-456', status: 'DONE' }
    ]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(fakeGuard)
      .overrideProvider(VideosService)
      .useValue(fakeVideosService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /health', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /me (autenticado via guard fake)', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .expect(200)
      .expect({ uid: 'test-user-123', email: 'test@example.com' });
  });

  it('POST /videos sem file -> 400', async () => {
    await request(app.getHttpServer())
      .post('/videos')
      .expect(400);
  });

  it('POST /videos com file -> 201 e chama service', async () => {
    await request(app.getHttpServer())
      .post('/videos')
      .attach('file', Buffer.from('fake-video-content'), 'test.mp4')
      .expect(201)
      .expect({ videoId: 'video-123', status: 'UPLOADED' });

    expect(fakeVideosService.createUpload).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        originalname: 'test.mp4',
        buffer: expect.any(Buffer),
      })
    );
  });

  it('GET /videos/:id retorna detalhes do vídeo', async () => {
    await request(app.getHttpServer())
      .get('/videos/video-123')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({
          videoId: 'video-123',
          status: 'UPLOADED',
          originalFilename: 'test.mp4',
        }));
      });

    expect(fakeVideosService.getVideo).toHaveBeenCalledWith('test-user-123', 'video-123');
  });

  it('POST /videos/:id/convert -> PROCESSING', async () => {
    await request(app.getHttpServer())
      .post('/videos/video-123/convert')
      .expect(201)
      .expect({ videoId: 'video-123', status: 'PROCESSING' });

    expect(fakeVideosService.requestConvert).toHaveBeenCalledWith('test-user-123', 'video-123');
  });

  it('GET /videos/:id/download retorna URL assinada', async () => {
    await request(app.getHttpServer())
      .get('/videos/video-123/download')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('url');
        expect(res.body).toHaveProperty('expiresAt');
        expect(res.body.url).toContain('storage.example.com');
      });

    expect(fakeVideosService.getDownloadUrl).toHaveBeenCalledWith('test-user-123', 'video-123');
  });

  it('GET /videos -> lista todos os vídeos', async () => {
    await request(app.getHttpServer())
      .get('/videos')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
      });

    expect(fakeVideosService.listVideos).toHaveBeenCalledWith('test-user-123', undefined);
  });

  it('GET /videos?status=DONE -> filtra por status', async () => {
    await request(app.getHttpServer())
      .get('/videos?status=DONE')
      .expect(200);

    expect(fakeVideosService.listVideos).toHaveBeenCalledWith('test-user-123', 'DONE');
  });

  afterEach(async () => {
    await app.close();
  });
});
