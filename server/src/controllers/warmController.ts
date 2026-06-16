// src/controllers/warmController.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sentryTracker } from "../lib/monitoring";

export const warmUp = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    console.log("🔥 Warming up backend services...");
    
    // 1. Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection warm");
    
    // 2. Optional: Test any other services you have
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`🔥 Backend warmup completed in ${duration}ms`);
    
    res.status(200).json({
      status: "warm",
      message: "Backend services are ready",
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      services: {
        database: "connected",
        api: "ready"
      }
    });
  } catch (error) {
    sentryTracker(error, { source: "warmController" });
    console.error("❌ Warmup failed:", error);
    
    res.status(500).json({
      status: "cold",
      error: "Warmup failed",
      timestamp: new Date().toISOString()
    });
  }
};