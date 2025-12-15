import { z } from 'zod';
import MESSAGES from '../../constants/messages';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Register validation schema
 * Validates user registration data
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(MESSAGES.VALIDATION_MESSAGES.INVALID_EMAIL),
    password: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(8, MESSAGES.AUTH_MESSAGES.WEAK_PASSWORD)
      .regex(PASSWORD_REGEX, MESSAGES.VALIDATION_MESSAGES.INVALID_PASSWORD),
    firstName: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(2, MESSAGES.VALIDATION_MESSAGES.MIN_LENGTH)
      .max(50, MESSAGES.VALIDATION_MESSAGES.MAX_LENGTH),
    lastName: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(2, MESSAGES.VALIDATION_MESSAGES.MIN_LENGTH)
      .max(50, MESSAGES.VALIDATION_MESSAGES.MAX_LENGTH),
    company: z.string().optional(),
  }),
});

/**
 * Login validation schema
 * Validates user login credentials
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(MESSAGES.VALIDATION_MESSAGES.INVALID_EMAIL),
    password: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD),
  }),
});

/**
 * Refresh token validation schema
 * Validates refresh token for token renewal
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD),
  }),
});

/**
 * Password reset request validation schema
 * Validates email for password reset request
 */
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .email(MESSAGES.VALIDATION_MESSAGES.INVALID_EMAIL),
  }),
});

/**
 * Password reset validation schema
 * Validates token and new password for password reset
 */
export const passwordResetSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(1, MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD),
    newPassword: z
      .string({ required_error: MESSAGES.VALIDATION_MESSAGES.REQUIRED_FIELD })
      .min(8, MESSAGES.AUTH_MESSAGES.WEAK_PASSWORD)
      .regex(PASSWORD_REGEX, MESSAGES.VALIDATION_MESSAGES.INVALID_PASSWORD),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>['body'];
export type PasswordResetInput = z.infer<typeof passwordResetSchema>['body'];