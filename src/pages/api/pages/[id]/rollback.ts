import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../../cms/auth';

export const POST: APIRoute = async ({ params, request, cookies }) => {
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

    const { revisionId } = await request.json() as { revisionId: string };

    if (!revisionId) {
      return new Response(
        JSON.stringify({ error: 'Revision ID is required' }),
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

    // 1. Fetch target revision content snapshot
    const revRow = await db.prepare(
      'SELECT content_json FROM page_revisions WHERE id = ? AND page_id = ?'
    ).bind(revisionId, id).first();

    if (!revRow) {
      return new Response(
        JSON.stringify({ error: 'Revision snapshot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetContentJson = revRow.content_json;

    // 2. Overwrite the working page draft with this revision snapshot
    await db.prepare(`
      INSERT INTO page_drafts (page_id, content_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(page_id) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, targetContentJson).run();

    const restoredDraft = JSON.parse(targetContentJson as string);

    return new Response(
      JSON.stringify({ success: true, restoredDraft }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Rollback error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
