import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const getSecret = (name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is missing. Copy server\\.env.example to server\\.env and set ${name}.`);
  }
  return value;
};

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const comparePassword = (p: string, h: string) => bcrypt.compare(p, h);

export const signAccess = (userId: string) =>
  jwt.sign({ sub: userId }, getSecret('JWT_ACCESS_SECRET'), { expiresIn: '30m' });

export const signRefresh = (userId: string) =>
  jwt.sign({ sub: userId }, getSecret('JWT_REFRESH_SECRET'), { expiresIn: '7d' });

export const verifyAccess = (token: string) =>
  jwt.verify(token, getSecret('JWT_ACCESS_SECRET')) as { sub: string };

export const verifyRefresh = (token: string) =>
  jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as { sub: string };

export const randomToken = () => crypto.randomBytes(48).toString('hex');
