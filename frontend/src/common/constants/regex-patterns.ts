
export class RegexPatterns {
  static readonly EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static readonly PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  static readonly PHONE = /^\+?[\d\s-()]+$/;
  static readonly URL = /^https?:\/\/.+/;
  static readonly ALPHANUMERIC = /^[a-zA-Z0-9]+$/;
  static readonly ALPHABETIC = /^[a-zA-Z\s]+$/;
  static readonly NUMERIC = /^\d+$/;
  static readonly DECIMAL = /^\d+(\.\d+)?$/;
}

