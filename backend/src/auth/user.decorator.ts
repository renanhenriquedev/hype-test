import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = { uid: string; email: string | null };

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as RequestUser;
  },
);
