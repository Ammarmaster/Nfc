// Cloudflare Pages Function: /api/menu
// Manages digital menu categories and items in Cloudflare D1.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return new Response(JSON.stringify({ categories: [], items: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [categoriesRes, itemsRes] = await Promise.all([
      env.DB.prepare(`
        SELECT id, business_id AS businessId, name, display_order AS displayOrder, is_active AS isActive, created_at AS createdAt
        FROM menu_categories
        WHERE business_id = ?
        ORDER BY display_order ASC
      `).bind(businessId).all(),
      env.DB.prepare(`
        SELECT 
          id, category_id AS categoryId, business_id AS businessId, name, description,
          price, is_veg AS isVeg, is_spicy AS isSpicy, is_available AS isAvailable,
          image_url AS imageUrl, tags, display_order AS displayOrder, created_at AS createdAt
        FROM menu_items
        WHERE business_id = ?
        ORDER BY display_order ASC
      `).bind(businessId).all(),
    ]);

    const categories = (categoriesRes.results || []).map((c: any) => ({
      ...c,
      isActive: Boolean(c.isActive),
    }));

    const items = (itemsRes.results || []).map((i: any) => ({
      ...i,
      isVeg: Boolean(i.isVeg),
      isSpicy: Boolean(i.isSpicy),
      isAvailable: Boolean(i.isAvailable),
      tags: i.tags ? JSON.parse(i.tags) : [],
    }));

    return new Response(JSON.stringify({ categories, items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Menu fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const data: any = await request.json();
    const type = data.type; // 'category' or 'item'
    const now = new Date().toISOString();

    if (type === 'category') {
      const id = data.id || `cat_${Date.now()}`;
      await env.DB.prepare(`
        INSERT INTO menu_categories (id, business_id, name, display_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, display_order = excluded.display_order
      `).bind(
        id,
        data.businessId,
        data.name,
        data.displayOrder || 1,
        1,
        now
      ).run();

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default item
    const itemId = data.id || `itm_${Date.now()}`;
    await env.DB.prepare(`
      INSERT INTO menu_items (
        id, category_id, business_id, name, description,
        price, is_veg, is_spicy, is_available, image_url, tags, display_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        is_veg = excluded.is_veg,
        is_spicy = excluded.is_spicy,
        is_available = excluded.is_available,
        image_url = excluded.image_url,
        tags = excluded.tags,
        display_order = excluded.display_order
    `).bind(
      itemId,
      data.categoryId,
      data.businessId,
      data.name,
      data.description || null,
      data.price || 0,
      data.isVeg !== false ? 1 : 0,
      data.isSpicy ? 1 : 0,
      data.isAvailable !== false ? 1 : 0,
      data.imageUrl || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.displayOrder || 1,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, id: itemId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Menu save failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'category' or 'item'
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (type === 'category') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM menu_items WHERE category_id = ?').bind(id),
        env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id),
      ]);
    } else {
      await env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true, deleted: id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
