import type {
  AuditLog,
  EmailVerificationToken,
  OAuthProvider,
  PasswordResetToken,
  RefreshToken,
  User,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * Phase 1.1 — the six account models ported from myfinpro
 * (docs/phase-1-design.md "Database Schema"). Compile-time smoke test on the
 * generated types plus runtime assertions on the generated field enums, so a
 * schema regression (renamed model, dropped delta, resurrected currency
 * field) fails here before any service depends on it.
 */
describe('Phase 1 Prisma models', () => {
  it('exports the six account model types from @prisma/client', () => {
    const types = [
      null as unknown as User,
      null as unknown as RefreshToken,
      null as unknown as OAuthProvider,
      null as unknown as EmailVerificationToken,
      null as unknown as PasswordResetToken,
      null as unknown as AuditLog,
    ];
    expect(types).toHaveLength(6);
  });

  it('registers the six models by name', () => {
    expect(Object.values(Prisma.ModelName)).toEqual(
      expect.arrayContaining([
        'User',
        'RefreshToken',
        'OAuthProvider',
        'EmailVerificationToken',
        'PasswordResetToken',
        'AuditLog',
      ]),
    );
  });

  it('applies the green-fluffy deltas to User: no currency, profile and media quota fields', () => {
    const fields = Object.values(Prisma.UserScalarFieldEnum);

    expect(fields).not.toContain('defaultCurrency');
    expect(fields).toEqual(
      expect.arrayContaining([
        'avatarMediaId',
        'bio',
        'mediaQuotaBytes',
        'mediaUsedBytes',
        'locale',
        'timezone',
        'emailVerified',
        'deletedAt',
        'scheduledDeletionAt',
      ]),
    );
  });

  it('keeps the token models on hashed, expiring, user-scoped rows', () => {
    for (const scalar of [
      Prisma.RefreshTokenScalarFieldEnum,
      Prisma.EmailVerificationTokenScalarFieldEnum,
      Prisma.PasswordResetTokenScalarFieldEnum,
    ]) {
      const fields = Object.values(scalar);
      expect(fields).toEqual(expect.arrayContaining(['tokenHash', 'userId', 'expiresAt']));
      expect(fields).not.toContain('token');
    }
    expect(Object.values(Prisma.RefreshTokenScalarFieldEnum)).toEqual(
      expect.arrayContaining(['revokedAt', 'replacedBy']),
    );
  });

  it('keeps OAuthProvider keyed by provider and providerId and AuditLog user-optional', () => {
    expect(Object.values(Prisma.OAuthProviderScalarFieldEnum)).toEqual(
      expect.arrayContaining(['provider', 'providerId', 'userId', 'email']),
    );
    expect(Object.values(Prisma.AuditLogScalarFieldEnum)).toEqual(
      expect.arrayContaining(['userId', 'action', 'entity', 'entityId', 'details']),
    );
  });
});
