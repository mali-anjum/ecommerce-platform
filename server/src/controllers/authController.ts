// auth.controller.ts (suggested)
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import bcrypt from "bcryptjs";
import { buildTokenInfo } from "../utils/auth/tokenInfo";
import { requireUserId } from "../utils/requireUserId";
import { UnauthorizedError } from "../utils/ApiError";
import { getClearSessionCookieOptions } from "../config/cookies";
import {
  createSessionForUser,
  hashToken,
  setTokens,
  signAccessToken,
} from "../services/auth/sessionTokens";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { mapAuthErrorResponse } from "../utils/auth/authErrors";
import { sentryTracker } from "../lib/monitoring";

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User with this email exists!",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      userId: user.id,
    });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    console.error("Registration error:", error);
    const { status, error: message } = mapAuthErrorResponse(error);
    res.status(status).json({ success: false, error: message });
  }
};

// UPDATED authController.ts - Login function
const login = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const { email, password } = req.body;
    console.log("[TRACE][BACKEND_LOGIN] /api/auth/login hit", {
      hasEmail: Boolean(email),
      passwordLength: password ? String(password).length : 0,
    });

    // Input validation
    if (!email || !password) {
      console.warn("❌ Missing credentials");
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    console.log(`🔍 Attempting login for: ${email}`);

    // Optimized database query with select only needed fields
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      console.warn(`❌ User not found: ${email}`);
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    if (!user.password) {
      console.warn(`❌ OAuth-only account attempted password login: ${email}`);
      res.status(401).json({
        success: false,
        error:
          "This account uses social sign-in. Please continue with Google, GitHub, or your linked provider.",
      });
      return;
    }

    // Password comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn(`❌ Invalid password for: ${email}`);
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = uuidv4();
    const hashedRefreshToken = hashToken(refreshToken);

    // Update user with refresh token (optimized)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    // Set cookies
    await setTokens(res, accessToken, refreshToken);

    const endTime = Date.now();
    console.log(`✅ Login successful for ${email} in ${endTime - startTime}ms`);

    // Same tokenInfo shape as refresh so the client can schedule rotation without an extra round trip
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokenInfo: buildTokenInfo(),
    });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    const endTime = Date.now();
    console.error(`💥 Login error after ${endTime - startTime}ms:`, error);

    res.status(500).json({
      success: false,
      error: "Login failed - please try again",
    });
  }
};

const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;
    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        profileComplete: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    console.error("Error fetching current user:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: "Refresh token required" });
      return;
    }

    // Verify refresh token
    const hashedToken = hashToken(refreshToken);
    const user = await prisma.user.findFirst({
      where: { refreshToken: hashedToken },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.clearCookie("accessToken", getClearSessionCookieOptions());
      res.clearCookie("refreshToken", getClearSessionCookieOptions());
      res.status(401).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    // Rotate refresh token on every refresh for replay resistance.
    const newAccessToken = signAccessToken(user.id, user.email, user.role);
    const newRefreshToken = uuidv4();
    const newHashedRefreshToken = hashToken(newRefreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashedRefreshToken, lastLogin: new Date() },
    });

    await setTokens(res, newAccessToken, newRefreshToken);

    const now = Date.now();

    res.json({
      success: true,
      message: "Token refreshed",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokenInfo: buildTokenInfo(now),
    });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    console.error("Token refresh error:", error);
    res.status(500).json({ success: false, error: "Token refresh failed" });
  }
};

const heartbeat = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = requireUserId(req, "Authentication required");

    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    res.status(200).json({
      success: true,
      message: "Session heartbeat recorded",
      tokenInfo: buildTokenInfo(),
    });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    console.error("Heartbeat error:", error);
    res.status(500).json({ success: false, error: "Heartbeat failed" });
  }
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const hashed = hashToken(refreshToken);
    await prisma.user.updateMany({
      where: { refreshToken: hashed },
      data: { refreshToken: null },
    });
  }

  res.clearCookie("accessToken", getClearSessionCookieOptions());
  res.clearCookie("refreshToken", getClearSessionCookieOptions());

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

/**
 * Issue a new access+refresh pair and set cookies (same as refresh flow).
 * Used after role changes (e.g. becoming a seller) so the JWT role claim updates.
 */
export const issueSessionForUser = async (
  res: Response,
  userId: string,
): Promise<{
  id: string;
  name: string | null;
  email: string;
  role: string;
}> => {
  const session = await createSessionForUser(res, userId);
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
};

const markProfileComplete = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = requireUserId(req, "Authentication required");
    await prisma.user.update({
      where: { id: userId },
      data: { profileComplete: true },
    });
    res.status(200).json({ success: true, message: "Profile marked complete" });
  } catch (error) {
    sentryTracker(error, { source: "authController" });
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    console.error("markProfileComplete error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
};

export {
  register,
  login,
  getCurrentUser,
  refreshAccessToken,
  heartbeat,
  logout,
  markProfileComplete,
};
