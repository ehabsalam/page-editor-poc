import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { key } = params;
    if (!key) {
      return new Response('Media asset key is required', { status: 400 });
    }

    const bucket = env.R2;
    if (!bucket) {
      return new Response('R2 Bucket binding not found', { status: 500 });
    }
    const object = await bucket.get(key);

    if (!object) {
      return new Response('Media asset not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache at edge/browser for 1 year

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching asset from R2:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
