import type { NextFunction, Request, Response } from 'express';
import { verifyAuthToken, type AuthTokenPayload } from '../utils/jwt';

export type AuthenticatedRequest = Request & {
  user?: AuthTokenPayload;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorizationHeader = req.header('Authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  const token = authorizationHeader.slice(7);

  try {
    req.user = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Authorization token is invalid' });
  }
}

export function authorizeRoles(...allowedRoles: Array<'employee' | 'manager' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
}
