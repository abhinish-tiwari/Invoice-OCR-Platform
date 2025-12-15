import AuthRepository, { CreateUserData, User } from './auth.repository';
import { hashPassword, comparePassword } from '../../utils/hash.util';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.util';
import MESSAGES from '../../constants/messages';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../middleware/error.middleware';
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
  tokens: { accessToken: string; refreshToken: string };
}

export default class AuthService {
  /** Register a new user */
  static async register(userData: CreateUserData): Promise<AuthResponse> {
    const existingUser = await AuthRepository.findByEmail(userData.email);
    if (existingUser) throw new ConflictError(MESSAGES.AUTH_MESSAGES.USER_ALREADY_EXISTS);

    const hashedPassword = await hashPassword(userData.password);
    const user = await AuthRepository.createUser({ ...userData, password: hashedPassword });
    const tokens = generateTokenPair({ userId: user.id, email: user.email, role: user.role });

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

  /** Login user */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await AuthRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.INVALID_CREDENTIALS);

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.INVALID_CREDENTIALS);

    await AuthRepository.updateLastLogin(user.id);
    const tokens = generateTokenPair({ userId: user.id, email: user.email, role: user.role });

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

  /** Refresh access token */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await AuthRepository.findById(payload.userId);
      if (!user) throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.USER_NOT_FOUND);

      const tokens = generateTokenPair({ userId: user.id, email: user.email, role: user.role });
      logger.info('Token refreshed successfully', { userId: user.id });
      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.INVALID_TOKEN);
    }
  }

  /** Get user profile */
  static async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await AuthRepository.findById(userId);
    if (!user) throw new NotFoundError(MESSAGES.AUTH_MESSAGES.USER_NOT_FOUND);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
