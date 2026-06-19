import type { APIRoute } from 'astro';
import { revokeSession } from '../../../cms/auth';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get('acree_session')?.value;
  await revokeSession(sessionToken);

  cookies.delete('acree_session', { path: '/' });
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
export const GET = POST;
