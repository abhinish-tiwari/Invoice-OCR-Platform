import { Request, Response } from 'express';
import authService from './auth.service';
import { AUTH_MESSAGES } from '../../constants/messages';
import { asyncHandler } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation';

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const userData: RegisterInput = req.body;

    const result = await authService.register(userData);

    res.status(201).json({
      success: true,
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      data: result,
    });
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginInput = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: result,
    });
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenInput = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
      data: { tokens },
    });
  });

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const user = await authService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  });
}

export default new AuthController();

