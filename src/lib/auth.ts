import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { expo } from '@better-auth/expo';
import { db } from '@/lib/db';
import { env } from '@/config/env';
import type { UserRole } from '@prisma/client';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  plugins: [
    expo({
      disableOriginOverride: true, // Critical for Expo SDK 54+ and Hono
    }),
  ],
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    `${env.EXPO_APP_SCHEME}://`,

    // Development mode: Expo Go patterns (official 2025 recommendation)
    ...(env.NODE_ENV === 'development'
      ? [
          'exp://*/*',
          'exp://10.0.0.*:*/*',
          'exp://192.168.*.*:*/*',
          'exp://172.*.*.*:*/*',
          'exp://localhost:*/*',
        ]
      : []),
  ],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user & { role: UserRole };
