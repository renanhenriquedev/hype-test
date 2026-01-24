import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { AuthModule } from 'src/auth/auth.module';
import { ConversionService } from './conversion.service';

@Module({
  imports: [FirebaseModule, AuthModule],
  controllers: [VideosController],
  providers: [VideosService, ConversionService]
})
export class VideosModule {}
