// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { loginUser } from '../../../../lib/auth';

export async function POST(request) {
  const { username, password } = await request.json();
  const token = loginUser(username, password);
  if (!token) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set('session', token, { httpOnly: true, path: '/' });
  return res;
}
