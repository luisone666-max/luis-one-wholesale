const SITE_URL = Deno.env.get("SITE_URL") || "https://luisonesupplyhub.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const FUNCTION_URL = (Deno.env.get("FUNCTION_URL") || `${SUPABASE_URL}/functions/v1/product-share`).replace(/\/$/, "");

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  category_id: string | null;
  moq: number | null;
  image_url: string | null;
  description: string | null;
};

type CategoryRow = {
  name_en: string;
};

type TierRow = {
  min_qty: number;
  max_qty: number | null;
  unit_price: number | string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(pathOrUrl: string | null | undefined) {
  const fallback = "/brand/luis-one-logo.jpg";
  const value = pathOrUrl || fallback;

  if (value.toLowerCase().endsWith(".svg")) {
    return `${SITE_URL}${fallback}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatMoney(value: number) {
  return `PHP ${value.toFixed(2)}`;
}

function priceRange(tiers: TierRow[]) {
  const prices = tiers.map((tier) => Number(tier.unit_price)).filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return "Contact us for quotation";
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`;
}

async function restFetch<T>(path: string): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json() as T;
}

function pageHtml({
  title,
  description,
  image,
  shareUrl,
  productUrl,
}: {
  title: string;
  description: string;
  image: string;
  shareUrl: string;
  productUrl: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeShareUrl = escapeHtml(shareUrl);
  const safeProductUrl = escapeHtml(productUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <link rel="canonical" href="${safeShareUrl}">
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${safeShareUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Luis One Supply Hub">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="1200">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImage}">
</head>
<body style="font-family:Arial,sans-serif;margin:0;background:#f4f4f5;color:#18181b;">
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
    <section style="max-width:460px;background:white;border:1px solid #e4e4e7;padding:24px;text-align:center;">
      <img src="${safeImage}" alt="${safeTitle}" style="width:160px;height:160px;object-fit:cover;border:1px solid #eee;">
      <h1 style="font-size:22px;line-height:1.25;margin:18px 0 8px;">${safeTitle}</h1>
      <p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 18px;">${safeDescription}</p>
      <a href="${safeProductUrl}" style="display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;background:#f65f18;color:white;text-decoration:none;font-weight:800;">Open Product</a>
    </section>
  </main>
</body>
</html>`;
}

function isSocialPreviewCrawler(userAgent: string) {
  return /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp/i.test(userAgent);
}

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() || "";
  const shareUrl = slug ? `${FUNCTION_URL}?slug=${encodeURIComponent(slug)}` : FUNCTION_URL;
  const productUrl = `${SITE_URL}/product/${encodeURIComponent(slug)}`;
  const userAgent = request.headers.get("user-agent") || "";

  if (slug && !isSocialPreviewCrawler(userAgent)) {
    return Response.redirect(productUrl, 302);
  }

  if (!slug) {
    return new Response(pageHtml({
      title: "Luis One Supply Hub | Wholesale Ordering",
      description: "Wholesale supply for resellers and shops with public tier pricing.",
      image: absoluteUrl("/brand/luis-one-logo.jpg"),
      shareUrl,
      productUrl: SITE_URL,
    }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
    });
  }

  const productRows = await restFetch<ProductRow[]>(
    `customer_products?slug=eq.${encodeURIComponent(slug)}&select=id,sku,name,slug,category_id,moq,image_url,description&limit=1`,
  );
  const product = productRows?.[0] ?? null;

  if (!product) {
    return new Response(pageHtml({
      title: "Luis One Supply Hub | Wholesale Ordering",
      description: "Browse current wholesale products from Luis One Supply Hub.",
      image: absoluteUrl("/brand/luis-one-logo.jpg"),
      shareUrl,
      productUrl: SITE_URL,
    }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
    });
  }

  const [tiers, categoryRows] = await Promise.all([
    restFetch<TierRow[]>(
      `product_price_tiers?product_id=eq.${product.id}&variant_id=is.null&select=min_qty,max_qty,unit_price&order=min_qty.asc`,
    ),
    product.category_id
      ? restFetch<CategoryRow[]>(`categories?id=eq.${product.category_id}&select=name_en&limit=1`)
      : Promise.resolve(null),
  ]);

  const prices = priceRange(tiers ?? []);
  const category = categoryRows?.[0]?.name_en ?? "Wholesale";
  const title = `${product.name} | ${prices}`;
  const description = `${category} wholesale item. MOQ ${product.moq ?? 1} pc. Price range: ${prices}.`;

  return new Response(pageHtml({
    title,
    description,
    image: absoluteUrl(product.image_url),
    shareUrl,
    productUrl,
  }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
  });
});
