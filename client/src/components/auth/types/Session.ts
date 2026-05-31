export interface Session {
  success: boolean;
  hasRefreshToken: boolean;
  hasAccessToken: boolean;
  cookiesPresent: string[];
  error?: string;
}