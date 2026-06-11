import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database binding not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const products = await db.prepare(
      'SELECT id, name, price, image_url, description, category FROM products ORDER BY name ASC'
    ).all();

    return new Response(
      JSON.stringify(products.results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fetch products error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
