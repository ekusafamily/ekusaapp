/**
 * EKUSA Digital Platform - JWT Strategy
 * Validates access tokens and decodes JWT payload into request.user.
 * User validation is deferred to a dedicated endpoint (e.g. /auth/me) or
 * resolved lazily only when the actual user record is needed.
 * Role checks are handled by RolesGuard separately.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: { sub: string; username: string; accountStatus: string }) {
    // Return the decoded JWT payload directly - no DB query.
    // The payload (sub, username, accountStatus) is trusted because it was
    // signed by our server. Downstream code can access user.id via request.user.sub
    return { id: payload.sub, username: payload.username, accountStatus: payload.accountStatus, sub: payload.sub };
  }
}