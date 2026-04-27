// auth.controller.ts (suggested)
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { buildTokenInfo } from "../utils/auth/tokenInfo";

function signAccessToken(userId: string, email: string, role: string) {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
}

// hash refresh token before storing (so DB safe)
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
} as const;

async function setTokens(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // ✅ 15 minutes (matches JWT)
  const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Access Token Cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Refresh Token Cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return {
    accessTokenExpiresIn: 15 * 60, // 15 minutes in seconds
    refreshTokenExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

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
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
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
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const refreshAccessToken = async (
  req: Request,
  res: Response
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
      res.clearCookie("accessToken", { ...cookieOptions });
      res.clearCookie("refreshToken", { ...cookieOptions });
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
    console.error("Token refresh error:", error);
    res.status(500).json({ success: false, error: "Token refresh failed" });
  }
};


const heartbeat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { lastLogin: new Date() },
    });

    res.status(200).json({
      success: true,
      message: "Session heartbeat recorded",
      tokenInfo: buildTokenInfo(),
    });
  } catch (error) {
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

  res.clearCookie("accessToken", { ...cookieOptions });
  res.clearCookie("refreshToken", { ...cookieOptions });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export { register, login, getCurrentUser, refreshAccessToken, heartbeat, logout };
