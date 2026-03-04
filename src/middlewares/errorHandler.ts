import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  errorCode?: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`${err.errorCode || 'ERROR'}: ${err.message}`, {
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      path: req.path,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode || 'INTERNAL_ERROR',
        message: err.message,
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma error:', { error: err, path: req.path });
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Terjadi kesalahan pada database',
      },
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    logger.error('Validation error:', { error: err, path: req.path });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid',
        details: process.env.NODE_ENV === 'development' ? err : undefined,
      },
    });
  }

  // Unknown errors
  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Terjadi kesalahan pada server' 
        : err.message,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
