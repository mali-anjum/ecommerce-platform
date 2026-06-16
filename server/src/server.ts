import "./config/loadEnv";
import { initSentry, registerProcessErrorHandlers, sentryTracker } from "./lib/monitoring";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import couponRoutes from "./routes/couponRoutes";
import settingsRoutes from "./routes/settingRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import sellerRoutes from "./routes/sellerRoutes";
import userRoutes from "./routes/userRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import aiRoutes from "./routes/aiRoutes";
import leadRoutes from "./routes/leadRoutes";
import warmRoutes from "./routes/warm"
import { ApiError } from "./utils/ApiError";
import { errorHandler } from "./middleware/errHandler";
import prisma from "./lib/prisma";
import { registerFeatureModuleRoutes } from "./config/featureFlags";
import { warmProductIndex } from "./services/ai/productIndex";

const app = express();
initSentry();
registerProcessErrorHandlers();

const PORT = process.env.PORT || 3001;

const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      console.log("🌐 CORS: Allowing request with no origin");
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3012",
      "https://www.postman.com", // added postman for testing endpoints
      "https://postman.com"
    ];

    if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/https?:\/\//, '')))) {
      console.log("✅ CORS: Allowed origin:", origin);
      callback(null, true);
    } else {
      console.log("🚫 CORS Blocked origin:", origin);
      console.log("📋 Allowed origins:", allowedOrigins);
      callback(new Error("CORS policy violation"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Cookie",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Set-Cookie", "Date", "ETag"],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
export { prisma };

// Routes
app.use("/api/warm", warmRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/leads", leadRoutes);

const moduleBootstraps = registerFeatureModuleRoutes(app, [
  {
    module: "ai",
    path: "/api/ai",
    router: aiRoutes,
    onListen: () =>
      warmProductIndex().then((count) => {
        console.log(`📦 AI product index warmed with ${count} products`);
      }),
  },
]);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from E-Commerce backend");
});

// Error handling middleware
app.use(errorHandler);

// 404 Handler for undefined routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  for (const bootstrap of moduleBootstraps) {
    void Promise.resolve(bootstrap()).catch((error) => {
      console.error("Feature module bootstrap failed", error);
      sentryTracker(error, { source: "featureBootstrap" });
    });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
