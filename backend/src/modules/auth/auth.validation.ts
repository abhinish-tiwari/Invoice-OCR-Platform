import { z } from 'zod';
import { AUTH_MESSAGES, VALIDATION_MESSAGES } from '../../constants/messages';

// Register validation schema
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(VALIDATION_MESSAGES.INVALID_EMAIL),
    password: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(8, AUTH_MESSAGES.WEAK_PASSWORD)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        VALIDATION_MESSAGES.INVALID_PASSWORD
      ),
    firstName: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH)
      .max(50, VALIDATION_MESSAGES.MAX_LENGTH),
    lastName: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH)
      .max(50, VALIDATION_MESSAGES.MAX_LENGTH),
    company: z.string().optional(),
  }),
});

// Login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(VALIDATION_MESSAGES.INVALID_EMAIL),
    password: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  }),
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  }),
});

// Password reset request validation schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  }),
});

// Password reset validation schema
export const passwordResetSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
    newPassword: z
      .string({ required_error: VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(8, AUTH_MESSAGES.WEAK_PASSWORD)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        VALIDATION_MESSAGES.INVALID_PASSWORD
      ),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>['body'];
export type PasswordResetInput = z.infer<typeof passwordResetSchema>['body'];

