import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../cms/auth';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;
    
    // Auth Check
    const sessionCookie = cookies.get('pixel_tavern_session')?.value;
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

    // Fetch page metadata, draft content and published content
    const pageResult = await db.prepare(`
      SELECT p.id, p.title, p.slug, 
             pd.content_json as draft_json,
             pb.content_json as pub_json
      FROM pages p
      LEFT JOIN page_drafts pd ON p.id = pd.page_id
      LEFT JOIN page_published pb ON p.id = pb.page_id
      WHERE p.id = ?
    `).bind(id).first();

    if (!pageResult) {
      return new Response(
        JSON.stringify({ error: 'Page not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const draft = pageResult.draft_json ? JSON.parse(pageResult.draft_json as string) : null;
    const published = pageResult.pub_json ? JSON.parse(pageResult.pub_json as string) : null;

    return new Response(
      JSON.stringify({
        id: pageResult.id,
        title: pageResult.title,
        slug: pageResult.slug,
        draft,
        published,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fetch page error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
