import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../../cms/auth';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;

    // Auth Check
    const sessionCookie = cookies.get('acree_session')?.value;
    const username = await verifySession(sessionCookie);
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Page ID is required' }),
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

    // Fetch list of revisions for this page sorted newest first
    const result = await db.prepare(`
      SELECT id, revision_number, created_at, created_by 
      FROM page_revisions 
      WHERE page_id = ? 
      ORDER BY revision_number DESC
    `).bind(id).all();

    return new Response(
      JSON.stringify(result.results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Fetch revisions error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
