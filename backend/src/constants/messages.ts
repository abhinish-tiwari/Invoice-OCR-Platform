export const AUTH_MESSAGES = {
  // Success messages
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  PASSWORD_RESET_REQUEST_SUCCESS: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully',

  // Error messages
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  EMAIL_NOT_VERIFIED: 'Please verify your email first',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  INVALID_EMAIL: 'Invalid email format',
};

export const INVOICE_MESSAGES = {
  // Success messages
  UPLOAD_SUCCESS: 'Invoice uploaded successfully',
  PROCESS_SUCCESS: 'Invoice processed successfully',
  UPDATE_SUCCESS: 'Invoice updated successfully',
  DELETE_SUCCESS: 'Invoice deleted successfully',
  FETCH_SUCCESS: 'Invoices fetched successfully',

  // Error messages
  UPLOAD_FAILED: 'Failed to upload invoice',
  PROCESS_FAILED: 'Failed to process invoice',
  INVALID_FILE_TYPE: 'Invalid file type. Only PDF and images are allowed',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVOICE_NOT_FOUND: 'Invoice not found',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this invoice',
};

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  MIN_LENGTH: 'Minimum length not met',
  MAX_LENGTH: 'Maximum length exceeded',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
};

export const SERVER_MESSAGES = {
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database error occurred',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
};

export const AWS_MESSAGES = {
  S3_UPLOAD_SUCCESS: 'File uploaded to S3 successfully',
  S3_UPLOAD_FAILED: 'Failed to upload file to S3',
  S3_DELETE_SUCCESS: 'File deleted from S3 successfully',
  S3_DELETE_FAILED: 'Failed to delete file from S3',
  TEXTRACT_SUCCESS: 'Document analyzed successfully',
  TEXTRACT_FAILED: 'Failed to analyze document',
};

export default {
  AUTH_MESSAGES,
  INVOICE_MESSAGES,
  VALIDATION_MESSAGES,
  SERVER_MESSAGES,
  AWS_MESSAGES,
};

