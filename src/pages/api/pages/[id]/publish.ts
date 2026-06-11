import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../../cms/auth';

export const POST: APIRoute = async ({ params, cookies }) => {
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

    // 1. Fetch current draft content
    const draftRow = await db.prepare(
      'SELECT content_json FROM page_drafts WHERE page_id = ?'
    ).bind(id).first();

    if (!draftRow) {
      return new Response(
        JSON.stringify({ error: 'No working draft found to publish.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const draftContentJson = draftRow.content_json;

    // 2. Promote to page_published table (storefront matches this)
    await db.prepare(`
      INSERT INTO page_published (page_id, content_json, published_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(page_id) DO UPDATE SET
        content_json = excluded.content_json,
        published_at = CURRENT_TIMESTAMP
    `).bind(id, draftContentJson).run();

    // 3. Find the highest existing revision number to increment it
    const maxRevRow = await db.prepare(
      'SELECT COALESCE(MAX(revision_number), 0) as max_rev FROM page_revisions WHERE page_id = ?'
    ).bind(id).first();

    const nextRevisionNumber = ((maxRevRow?.max_rev as number) || 0) + 1;
    const revisionId = crypto.randomUUID();
    // Fetch the user ID based on the authenticated username
    const userRow = await db.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first() as { id: string } | null;
    const userId = userRow?.id || 'admin-1';

    // 4. Save a historical content snapshot in page_revisions table
    await db.prepare(`
      INSERT INTO page_revisions (id, page_id, revision_number, content_json, created_at, created_by)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `).bind(
      revisionId,
      id,
      nextRevisionNumber,
      draftContentJson,
      userId // Log userId as creator of this revision
    ).run();

    return new Response(
      JSON.stringify({ success: true, revisionId, revisionNumber: nextRevisionNumber }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Publish error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
