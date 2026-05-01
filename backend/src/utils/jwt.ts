import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  username: string;
}

interface AdminPayload {
  adminId: string;
  username: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
}

export function generateRefreshToken(userId: string): string {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, options);
}

export function generateAdminToken(payload: AdminPayload): string {
  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
}

export function verifyToken(token: string, secret: string): TokenPayload | AdminPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload | AdminPayload;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): TokenPayload | null {
  return verifyToken(token, process.env.JWT_SECRET!) as TokenPayload | null;
}

export function verifyAdminToken(token: string): AdminPayload | null {
  return verifyToken(token, process.env.JWT_SECRET!) as AdminPayload | null;
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    return payload;
  } catch {
    return null;
  }
}
