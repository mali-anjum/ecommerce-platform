
import { Request } from 'express';

// Properly extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      user?: {
        userId: string;
        email: string;
        role?: string;
      };
      /** Set by `attachSellerProfile` for users with role SELLER */
      sellerProfile?: { id: string };
      files?: Express.Multer.File[];
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      FRONTEND_URL: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      ACCESS_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: string;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRY: string;
      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      PAYPAL_MODE: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      EMAIL_FROM: string;
      LOG_ENABLED: string;
      LOG_LEVEL: string;
    }
  }
}

// New strongly-typed interface for authenticated routes
export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
  sellerProfile?: { id: string };
  validatedData?: any;
}
