import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';

@Module({
  imports: [FirebaseModule],
  controllers: [AuthController],
  providers: [FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}
