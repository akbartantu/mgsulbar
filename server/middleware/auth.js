import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const clientId = process.env.GOOGLE_CLIENT_ID;
const client = clientId ? new OAuth2Client(clientId) : null;

function getJwtSecret() {
  const raw = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return typeof raw === 'string' ? raw.trim() : raw;
}

export async function verifyGoogleToken(idToken) {
  if (!client || !idToken) return null;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    return {
      id: payload.sub,
      name: payload.name || payload.email || 'User',
      email: payload.email,
      avatar: payload.picture,
    };
  } catch {
    return null;
  }
}

function verifyAdminJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(trimmed, secret);
    if (decoded && decoded.source === 'password') return decoded;
    return null;
  } catch {
    return null;
  }
}

const GUEST_USER = { id: 'guest', name: 'Guest', email: '', role: 'viewer', department: '', source: 'password' };

export async function authMiddleware(req, res, next) {
  const bypassAuth = process.env.BYPASS_AUTH === 'true';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    if (bypassAuth) {
      req.user = GUEST_USER;
      return next();
    }
    return res.status(401).json({ error: 'Authorization required' });
  }

  const profile = await verifyGoogleToken(token);
  if (profile) {
    req.user = profile;
    return next();
  }
  const adminUser = verifyAdminJwt(token);
  if (adminUser) {
    req.user = adminUser;
    return next();
  }

  if (bypassAuth) {
    req.user = GUEST_USER;
    return next();
  }
  return res.status(401).json({ error: 'Invalid or expired token' });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  verifyGoogleToken(token).then((profile) => {
    req.user = profile;
    next();
  }).catch(() => {
    req.user = null;
    next();
  });
}
