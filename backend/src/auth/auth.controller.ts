import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';
import { User } from './user.decorator';
import type { RequestUser } from './user.decorator';

@Controller()
export class AuthController {
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  me(@User() user: RequestUser) {
    return { uid: user.uid, email: user.email };
  }
}
