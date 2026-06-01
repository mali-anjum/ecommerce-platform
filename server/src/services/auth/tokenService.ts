import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { buildTokenInfo } from "../../utils/auth/tokenInfo";

const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  path: "/",
  ...(process.env.COOKIE_DOMAIN?.trim()
    ? { domain: process.env.COOKIE_DOMAIN.trim() }
    : {}),
};

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  profileComplete?: boolean;
};

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  tokenInfo: ReturnType<typeof buildTokenInfo>;
};

/**
 * JWT access tokens, refresh token rotation, and HttpOnly session cookies.
 * Shared by email/password login and OAuth flows.
 */
export class TokenService {
  signAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
    const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return {
      accessTokenExpiresIn: 15 * 60,
      refreshTokenExpiresIn: 7 * 24 * 60 * 60,
    };
  }

  /** Issue JWT + refresh token without writing cookies (OAuth exchange handoff). */
  async issueSessionForUser(userId: string): Promise<IssuedSession> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isActive: true,
        profileComplete: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = uuidv4();
    const hashedRefreshToken = this.hashToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken, lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        profileComplete: user.profileComplete,
      },
      tokenInfo: buildTokenInfo(),
    };
  }

  /** Issue session and write auth cookies (login + refresh flows). */
  async createSessionForUser(
    res: Response,
    userId: string,
  ): Promise<{ user: SessionUser; tokenInfo: ReturnType<typeof buildTokenInfo> }> {
    const session = await this.issueSessionForUser(userId);
    await this.setSessionCookies(res, session.accessToken, session.refreshToken);
    return { user: session.user, tokenInfo: session.tokenInfo };
  }
}

export const tokenService = new TokenService();

export const signAccessToken = (
  userId: string,
  email: string,
  role: string,
) => tokenService.signAccessToken(userId, email, role);

export const hashToken = (token: string) => tokenService.hashToken(token);

export const setSessionCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => tokenService.setSessionCookies(res, accessToken, refreshToken);

export const issueSessionForUser = (userId: string) =>
  tokenService.issueSessionForUser(userId);

export const createSessionForUser = (res: Response, userId: string) =>
  tokenService.createSessionForUser(res, userId);

export const setTokens = setSessionCookies;
