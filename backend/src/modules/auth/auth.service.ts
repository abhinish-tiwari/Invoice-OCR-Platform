import authRepository, { CreateUserData, User } from './auth.repository';
import { hashPassword, comparePassword } from '../../utils/hash.util';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.util';
import { AUTH_MESSAGES } from '../../constants/messages';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: CreateUserData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await authRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError(AUTH_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user by email
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await authRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find user
      const user = await authRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError(AUTH_MESSAGES.USER_NOT_FOUND);
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_TOKEN);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new AuthService();

