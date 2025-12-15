import { Request, Response } from 'express';
import AuthService from './auth.service';
import MESSAGES from '../../constants/messages';
import { asyncHandler } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation';
import { CreateUserData } from './auth.repository';

export default class AuthController {
  /**
   * Register a new user
   * @route POST /api/v1/auth/register
   * @access Public
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: RegisterInput = req.body;
    const result = await AuthService.register(userData as CreateUserData);

    res.status(201).json({
      success: true,
      message: MESSAGES.AUTH_MESSAGES.REGISTER_SUCCESS,
      data: result,
    });
  });

  /**
   * Login user
   * @route POST /api/v1/auth/login
   * @access Public
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginInput = req.body;
    const result = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      message: MESSAGES.AUTH_MESSAGES.LOGIN_SUCCESS,
      data: result,
    });
  });

  /**
   * Refresh access token
   * @route POST /api/v1/auth/refresh
   * @access Public
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken }: RefreshTokenInput = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: MESSAGES.AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
      data: { tokens },
    });
  });

  /**
   * Get current user profile
   * @route GET /api/v1/auth/profile
   * @access Private
   */
  static getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.userId;
    const user = await AuthService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * Logout user
   * @route POST /api/v1/auth/logout
   * @access Private
   */
  static logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: MESSAGES.AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  });
}