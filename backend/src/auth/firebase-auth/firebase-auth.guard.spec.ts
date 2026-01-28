import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from '../../firebase/firebase.service';

describe('FirebaseAuthGuard', () => {
  const makeCtx = (headers: Record<string, string | undefined>) => {
    const req: any = { headers };
    const res: any = {};
    const next: any = jest.fn();

    const httpHost: HttpArgumentsHost = {
      getRequest: () => req,
      getResponse: () => res,
      getNext: () => next,
    };

    const ctx = {
      switchToHttp: () => httpHost,
    } as unknown as ExecutionContext;

    return { ctx, req, res, next };
  };

  it('nega sem Authorization header', async () => {
    const firebase = { auth: { verifyIdToken: jest.fn() } } as any as FirebaseService;
    const guard = new FirebaseAuthGuard(firebase);

    const { ctx } = makeCtx({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('nega com Authorization sem Bearer', async () => {
    const firebase = { auth: { verifyIdToken: jest.fn() } } as any as FirebaseService;
    const guard = new FirebaseAuthGuard(firebase);

    const { ctx } = makeCtx({ authorization: 'Token abc' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('nega quando verifyIdToken falha', async () => {
    const firebase = {
      auth: { verifyIdToken: jest.fn().mockRejectedValue(new Error('bad token')) },
    } as any as FirebaseService;

    const guard = new FirebaseAuthGuard(firebase);
    const { ctx } = makeCtx({ authorization: 'Bearer invalid' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita token válido e popula req.user', async () => {
    const firebase = {
      auth: {
        verifyIdToken: jest.fn().mockResolvedValue({ uid: 'u1', email: 'a@b.com' }),
      },
    } as any as FirebaseService;

    const guard = new FirebaseAuthGuard(firebase);
    const { ctx, req } = makeCtx({ authorization: 'Bearer good' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({ uid: 'u1', email: 'a@b.com' });
  });

  it('aceita token válido sem email', async () => {
    const firebase = {
      auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'u1' }) },
    } as any as FirebaseService;

    const guard = new FirebaseAuthGuard(firebase);
    const { ctx, req } = makeCtx({ authorization: 'Bearer good' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({ uid: 'u1', email: null });
  });
});
