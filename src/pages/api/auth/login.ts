import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyPassword, createSession, SESSION_TTL_SECONDS } from '../../../cms/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json() as { username: string; password: string };

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database binding not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const user = await db.prepare(
      'SELECT id, username, password_hash FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordValid = await verifyPassword(password, user.password_hash as string);
    if (!passwordValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = await createSession(username);

    const isSecure = new URL(request.url).protocol === 'https:';
    cookies.set('pixel_tavern_session', token, {
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
