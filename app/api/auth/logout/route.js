// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { logoutUser } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (token) logoutUser(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
