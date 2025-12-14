import { Config } from '../config/app.config';

export class Token {
  private static readonly TOKEN_KEY = Config.TOKEN_KEY;
  private static readonly REFRESH_TOKEN_KEY = Config.REFRESH_TOKEN_KEY;

  static get(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static set(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefresh(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefresh(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static remove(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static removeRefresh(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static clear(): void {
    this.remove();
    this.removeRefresh();
  }

  static has(): boolean {
    return !!this.get();
  }

  static hasRefresh(): boolean {
    return !!this.getRefresh();
  }

  static decode<T = any>(token?: string): T | null {
    try {
      const tokenToDecode = token || this.get();
      if (!tokenToDecode) return null;

      const base64Url = tokenToDecode.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[Token] Failed to decode token:', error);
      return null;
    }
  }

  static isExpired(token?: string): boolean {
    const decoded = this.decode<{ exp: number }>(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  static getExpiration(token?: string): Date | null {
    const decoded = this.decode<{ exp: number }>(token);
    if (!decoded || !decoded.exp) return null;

    return new Date(decoded.exp * 1000);
  }

  static getTimeUntilExpiration(token?: string): number | null {
    const decoded = this.decode<{ exp: number }>(token);
    if (!decoded || !decoded.exp) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  }
}