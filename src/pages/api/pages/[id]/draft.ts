import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../../cms/auth';
import type { Section } from '../../../../cms/types';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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

    const { seo, sections } = await request.json() as { seo: Record<string, string>; sections: Section[] };

    if (!seo || !sections) {
      return new Response(
        JSON.stringify({ error: 'SEO and sections fields are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { schemaRegistry } = await import('../../../../cms/registry');
    
    // Server-side Zod Validation for every layout section
    for (const section of sections) {
      const schema = schemaRegistry[section.type];
      if (schema) {
        const parseResult = schema.safeParse(section.props);
        if (!parseResult.success) {
          const errors = parseResult.error.errors.map((e) => e.message).join(', ');
          return new Response(
            JSON.stringify({ 
              error: `Validation error in ${section.type} section: ${errors}` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const db = env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database binding not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construct full page JSON representation
    const pageContent = {
      id,
      slug: id === 'homepage' ? '/' : `/${id}`,
      seo,
      sections,
    };

    const contentJsonString = JSON.stringify(pageContent);

    // Save/Update draft content
    await db.prepare(`
      INSERT INTO page_drafts (page_id, content_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(page_id) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, contentJsonString).run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Draft save error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
export const POST = PUT; // Support POST as fallback
