export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthError {
  message: string;
  field?: string;
}

