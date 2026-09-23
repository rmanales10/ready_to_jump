import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const SECRET_KEY = process.env.JWT_SECRET || 'readytojump-admin-super-secure-jwt-secret-key-2026';
const encodedSecret = new TextEncoder().encode(SECRET_KEY);

export const COOKIE_NAME = 'admin_token';

export interface AdminPayload {
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token using jose
 */
export async function signJWT(payload: { email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Ensures the default admin account exists in Firestore database
 */
export async function ensureAdminAccount(): Promise<void> {
  const defaultEmail = 'admin@readytojump.com';
  const defaultPassword = 'readytojump123';

  try {
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('email', '==', defaultEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const passwordHash = await hashPassword(defaultPassword);
      const adminDocRef = doc(adminsRef, defaultEmail);
      await setDoc(adminDocRef, {
        email: defaultEmail,
        username: defaultEmail,
        passwordHash: passwordHash,
        role: 'admin',
        createdAt: Timestamp.now(),
        lastLogin: null,
      });
      console.log('✅ Default admin account saved to Firestore database:', defaultEmail);
    }
  } catch (error) {
    console.error('Error ensuring default admin account:', error);
  }
}
