import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const guardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(guardMock)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('me', () => {
    it('retorna uid e email do usuário autenticado', () => {
      const user = { uid: 'user123', email: 'test@example.com' };
      const result = controller.me(user);

      expect(result).toEqual({
        uid: 'user123',
        email: 'test@example.com',
      });
    });

    it('retorna uid e email null se não tiver email', () => {
      const user = { uid: 'user456', email: null };
      const result = controller.me(user);

      expect(result).toEqual({
        uid: 'user456',
        email: null,
      });
    });
  });
});
