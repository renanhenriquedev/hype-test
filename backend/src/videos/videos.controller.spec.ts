import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';

describe('VideosController', () => {
 let controller: VideosController;

  const videosService = {
    createUpload: jest.fn(),
    getVideo: jest.fn(),
    requestConvert: jest.fn(),
    getDownloadUrl: jest.fn(),
    listVideos: jest.fn(),
  };

  const guardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        { provide: VideosService, useValue: videosService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(guardMock)
      .compile();

    controller = module.get<VideosController>(VideosController);
  });

  it('uploadVideo: lança 400 se faltar arquivo', async () => {
    await expect(
      controller.uploadVideo({ uid: 'u1', email: 'x@y.com' }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploadVideo: chama service.createUpload com uid e file', async () => {
    videosService.createUpload.mockResolvedValue({ videoId: 'v1', status: 'UPLOADED' });

    const file: any = {
      originalname: 'a.mp4',
      mimetype: 'video/mp4',
      size: 123,
      buffer: Buffer.from('x'),
    };

    await expect(controller.uploadVideo({ uid: 'u1', email: null }, file)).resolves.toEqual({
      videoId: 'v1',
      status: 'UPLOADED',
    });

    expect(videosService.createUpload).toHaveBeenCalledWith('u1', file);
  });

  it('getVideo: repassa uid + videoId', async () => {
    videosService.getVideo.mockResolvedValue({ videoId: 'v1', status: 'UPLOADED' });

    await expect(controller.getVideo({ uid: 'u1', email: null }, 'v1')).resolves.toEqual({
      videoId: 'v1',
      status: 'UPLOADED',
    });

    expect(videosService.getVideo).toHaveBeenCalledWith('u1', 'v1');
  });

  it('convert: repassa uid + videoId', async () => {
    videosService.requestConvert.mockResolvedValue({ videoId: 'v1', status: 'PROCESSING' });

    await expect(controller.convert({ uid: 'u1', email: null }, 'v1')).resolves.toEqual({
      videoId: 'v1',
      status: 'PROCESSING',
    });

    expect(videosService.requestConvert).toHaveBeenCalledWith('u1', 'v1');
  });

  it('download: repassa uid + videoId', async () => {
    videosService.getDownloadUrl.mockResolvedValue({ url: 'http://x', expiresAt: 'iso' });

    await expect(controller.getDownloadUrl({ uid: 'u1', email: null }, 'v1')).resolves.toEqual({
      url: 'http://x',
      expiresAt: 'iso',
    });

    expect(videosService.getDownloadUrl).toHaveBeenCalledWith('u1', 'v1');
  });

  it('list: repassa uid + status (quando vem)', async () => {
    videosService.listVideos.mockResolvedValue([{ videoId: 'v1' }]);

    await expect(controller.list({ uid: 'u1', email: null }, 'DONE')).resolves.toEqual([
      { videoId: 'v1' },
    ]);

    expect(videosService.listVideos).toHaveBeenCalledWith('u1', 'DONE');
  });
});
