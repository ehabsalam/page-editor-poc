import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifySession } from '../../../cms/auth';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Auth Check
    const sessionCookie = cookies.get('pixel_tavern_session')?.value;
    const username = await verifySession(sessionCookie);
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database binding not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.prepare(
      'SELECT id, filename, url, file_size, created_at FROM media_assets ORDER BY created_at DESC'
    ).all();

    return new Response(
      JSON.stringify(result.results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('List media error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Auth Check
    const sessionCookie = cookies.get('pixel_tavern_session')?.value;
    const username = await verifySession(sessionCookie);
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = env.DB;
    const bucket = env.R2;
    if (!db || !bucket) {
      return new Response(
        JSON.stringify({ error: 'D1 or R2 bindings not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only standard images are supported.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds maximum 5MB limit.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique key
    const extension = file.name.split('.').pop() || 'jpg';
    const uniqueKey = `${crypto.randomUUID()}.${extension}`;

    // Upload to Cloudflare R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(uniqueKey, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // Save metadata reference in D1
    const mediaId = crypto.randomUUID();
    const mediaUrl = `/api/media/${uniqueKey}`;

    await db.prepare(`
      INSERT INTO media_assets (id, filename, r2_key, mime_type, file_size, url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(mediaId, file.name, uniqueKey, file.type, file.size, mediaUrl).run();

    return new Response(
      JSON.stringify({
        id: mediaId,
        filename: file.name,
        url: mediaUrl,
        size: file.size,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Media upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
