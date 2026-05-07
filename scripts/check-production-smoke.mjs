const defaultBaseUrl = "https://luisonesupplyhub.com";
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || defaultBaseUrl).replace(/\/+$/, "");

const publicChecks = [
  { path: "/", name: "home page", minLength: 1000 },
  { path: "/category/all", name: "product listing", minLength: 1000 },
  { path: "/admin/login", name: "admin login page", minLength: 500 },
  { path: "/meta/catalog-feed.csv", name: "Meta catalog feed", minLength: 100 },
  { path: "/share/product/1", name: "Facebook product share page", minLength: 500 },
];

const protectedApiChecks = [
  "/api/admin/products",
  "/api/admin/orders",
  "/api/admin/categories",
  "/api/admin/pos/sales",
];

function absolute(path) {
  return `${baseUrl}${path}`;
}

async function fetchText(path) {
  const response = await fetch(absolute(path), {
    headers: {
      "user-agent": "LuisOneProductionSmokeCheck/1.0",
    },
  });
  const text = await response.text();
  return { response, text };
}

function requireStatus(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkPublicPage(check) {
  const { response, text } = await fetchText(check.path);
  requireStatus(response.status === 200, `${check.name} expected 200, got ${response.status}`);
  requireStatus(text.length >= check.minLength, `${check.name} response is unexpectedly short`);

  console.log(`ok ${response.status} ${check.path} ${text.length} bytes`);
  return text;
}

async function checkProtectedApi(path) {
  const { response } = await fetchText(path);
  requireStatus(response.status === 403, `${path} expected 403 for logged-out visitor, got ${response.status}`);
  console.log(`ok ${response.status} ${path}`);
}

function checkShareTags(html) {
  const title = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ?? "";
  const siteName = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)?.[1] ?? "";
  const image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] ?? "";
  const description = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] ?? "";

  requireStatus(title.length > 5, "share page is missing an OG title");
  requireStatus(siteName.includes("Luis One Supply Hub"), "share page is missing Luis One Supply Hub OG site name");
  requireStatus(title.includes("PHP") || description.includes("PHP"), "share page OG text should include PHP pricing");
  requireStatus(/^https:\/\//.test(image), "share page is missing an absolute HTTPS OG image");

  console.log(`ok share OG title="${title}"`);
  console.log(`ok share OG image=${image}`);
}

function checkCatalogFeed(csv) {
  const header = csv.split(/\r?\n/, 1)[0] ?? "";
  for (const column of ["id", "title", "price", "link", "image_link"]) {
    requireStatus(header.includes(column), `Meta catalog feed is missing ${column} column`);
  }

  console.log("ok Meta catalog feed required columns found");
}

async function main() {
  console.log(`Production smoke check: ${baseUrl}`);
  const pageResults = new Map();

  for (const check of publicChecks) {
    pageResults.set(check.path, await checkPublicPage(check));
  }

  for (const path of protectedApiChecks) {
    await checkProtectedApi(path);
  }

  checkShareTags(pageResults.get("/share/product/1") ?? "");
  checkCatalogFeed(pageResults.get("/meta/catalog-feed.csv") ?? "");
  console.log("Production smoke check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
