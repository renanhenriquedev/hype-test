import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { ConversionService } from './conversion.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ConfigService } from '@nestjs/config';

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideosService, { provide: FirebaseService, useValue: {} }, ConversionService, { provide: ConfigService, useValue: {} }],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
