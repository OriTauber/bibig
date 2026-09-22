import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
declare global { namespace Express { interface Request { auth?: { userId: string } } } }
export function authenticate(secret: string) { return (request: Request, response: Response, next: NextFunction) => { const token = request.header('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) return response.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }); try { const payload = jwt.verify(token, secret); if (typeof payload === 'string' || !payload.sub) throw new Error(); request.auth = { userId: payload.sub }; return next() } catch { return response.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' } }) } } }
