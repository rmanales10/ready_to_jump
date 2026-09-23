import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signJWT, comparePassword, ensureAdminAccount, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and Password are required' },
        { status: 400 }
      );
    }

    const cleanInput = username.trim().toLowerCase();

    // Ensure database contains the default admin
    await ensureAdminAccount();

    // Query Firestore for admin by email or username
    const adminsRef = collection(db, 'admins');
    let q = query(adminsRef, where('email', '==', cleanInput));
    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      q = query(adminsRef, where('username', '==', cleanInput));
      snapshot = await getDocs(q);
    }

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password hash
    const isPasswordValid = await comparePassword(password, adminData.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Update lastLogin in Firestore
    try {
      await updateDoc(doc(db, 'admins', adminDoc.id), {
        lastLogin: Timestamp.now(),
      });
    } catch (err) {
      console.warn('Failed to update admin lastLogin timestamp:', err);
    }

    // Generate JWT token
    const token = await signJWT({
      email: adminData.email || cleanInput,
      role: adminData.role || 'admin',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email: adminData.email || cleanInput,
        role: adminData.role || 'admin',
      },
    });

    // Set secure HTTP-only cookie with JWT token
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred' },
      { status: 500 }
    );
  }
}
