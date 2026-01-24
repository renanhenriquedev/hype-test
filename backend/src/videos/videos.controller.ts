import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';
import { User } from '../auth/user.decorator';
import type { RequestUser } from  '../auth/user.decorator';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @User() user: RequestUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Missing multipart field: file');

    return this.videos.createUpload(user.uid, file);
  }

  @Get(':videoId')
  @UseGuards(FirebaseAuthGuard)
  async getVideo(@User() user: RequestUser, @Param('videoId') videoId: string) {
    return this.videos.getVideo(user.uid, videoId);
  }

  @Post(':videoId/convert')
  @UseGuards(FirebaseAuthGuard)
  async convert(@User() user: RequestUser, @Param('videoId') videoId: string) {
    return this.videos.requestConvert(user.uid, videoId);
  }

  @Get(':videoId/download')
  @UseGuards(FirebaseAuthGuard)
  async getDownloadUrl(
    @User() user: RequestUser,
    @Param('videoId') videoId: string,
  ) {
    return this.videos.getDownloadUrl(user.uid, videoId);
  }
}
