// src/middleware/validation.ts
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';
import { sentryTracker } from '../lib/monitoring';

export const validate = (schema: z.ZodSchema) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        } catch (error) {
            sentryTracker(error, { source: "validation" });
            if (error instanceof z.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};