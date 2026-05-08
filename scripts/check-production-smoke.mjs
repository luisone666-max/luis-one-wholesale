const defaultBaseUrl = "https://luisonesupplyhub.com";
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || defaultBaseUrl).replace(/\/+$/, "");

const publicChecks = [
  { path: "/", name: "home page", minLength: 1000 },
  { path: "/category/all", name: "product listing", minLength: 1000 },
  { path: "/product/1", name: "product detail", minLength: 1000 },
  { path: "/login", name: "customer login page", minLength: 500 },
  { path: "/register", name: "customer register page", minLength: 500 },
  { path: "/admin/login", name: "admin login page", minLength: 500 },
  { path: "/meta/catalog-feed.csv", name: "Meta catalog feed", minLength: 100 },
  { path: "/share/product/1", name: "Facebook product share page", minLength: 500 },
  { path: "/robots.txt", name: "robots.txt", minLength: 50 },
];

const customerPageChecks = new Set(["/", "/category/all", "/product/1", "/login", "/register"]);
const adminOnlyLeakTerms = [
  "supplier_notes",
  "internal_cost_notes",
  "admin_notes",
  "supplier notes snapshot",
  "internal cost notes",
  "admin notes",
];
const publicErrorTerms = [
  "using mock catalog data",
  "catalog is refreshing",
  "supabase auth is not configured",
  "supabase server credentials are not configured",
];

const protectedApiChecks = [
  "/api/admin/products",
  "/api/admin/orders",
  "/api/admin/categories",
  "/api/admin/pos/sales",
  "/api/admin/cash-drawer",
  "/api/admin/staff",
];

const protectedPageChecks = [
  "/admin",
  "/admin/products",
  "/admin/orders",
  "/admin/reports",
  "/admin/staff",
  "/admin/sales-desk",
  "/admin/cashier",
  "/admin/cash-drawer",
  "/admin/owner",
  "/admin/settings",
  "/admin/help",
];

const notFoundChecks = [
  "/dev/supabase-test",
];

const searchChecks = [
  {
    path: "/category/all?q=ignition",
    term: "ignition",
  },
  {
    path: "/category/all?q=n%20max",
    term: "n max",
  },
  {
    path: "/category/all?q=top%20box",
    term: "top box",
  },
  {
    path: "/category/all?q=helmet",
    term: "helmet",
  },
  {
    path: "/category/all?q=brake",
    term: "brake",
  },
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

async function checkProtectedPage(path) {
  const response = await fetch(absolute(path), {
    headers: {
      "user-agent": "LuisOneProductionSmokeCheck/1.0",
    },
    redirect: "manual",
  });
  const location = response.headers.get("location") ?? "";

  requireStatus(
    response.status === 307 || response.status === 308 || response.status === 302,
    `${path} expected redirect for logged-out visitor, got ${response.status}`,
  );
  requireStatus(location.includes("/admin/login"), `${path} should redirect to /admin/login, got "${location}"`);
  console.log(`ok ${response.status} ${path} -> ${location}`);
}

async function checkNotFound(path) {
  const response = await fetch(absolute(path), {
    headers: {
      "user-agent": "LuisOneProductionSmokeCheck/1.0",
    },
    redirect: "manual",
  });

  requireStatus(response.status === 404, `${path} expected 404 in production, got ${response.status}`);
  console.log(`ok ${response.status} ${path}`);
}

function checkProductOgTags(html, label) {
  const title = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ?? "";
  const siteName = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)?.[1] ?? "";
  const image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] ?? "";
  const description = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] ?? "";

  requireStatus(title.length > 5, `${label} is missing an OG title`);
  requireStatus(siteName.includes("Luis One Supply Hub"), `${label} is missing Luis One Supply Hub OG site name`);
  requireStatus(title.includes("PHP") || description.includes("PHP"), `${label} OG text should include PHP pricing`);
  requireStatus(/^https:\/\//.test(image), `${label} is missing an absolute HTTPS OG image`);

  console.log(`ok ${label} OG title="${title}"`);
  console.log(`ok ${label} OG image=${image}`);
}

function checkCatalogFeed(csv) {
  const header = csv.split(/\r?\n/, 1)[0] ?? "";
  for (const column of ["id", "title", "price", "link", "image_link"]) {
    requireStatus(header.includes(column), `Meta catalog feed is missing ${column} column`);
  }

  console.log("ok Meta catalog feed required columns found");
}

function checkRobotsTxt(text) {
  requireStatus(text.includes("Sitemap:"), "robots.txt is missing Sitemap");
  requireStatus(text.includes("facebookexternalhit"), "robots.txt is missing facebookexternalhit allow rule");
  requireStatus(text.includes("Disallow: /admin"), "robots.txt should disallow admin pages");
  console.log("ok robots.txt rules found");
}

function checkCustomerPageSafety(path, html) {
  const lower = html.toLowerCase();
  const leaked = adminOnlyLeakTerms.find((term) => lower.includes(term));
  const publicError = publicErrorTerms.find((term) => lower.includes(term));

  requireStatus(!leaked, `${path} appears to expose admin-only text: ${leaked}`);
  requireStatus(!publicError, `${path} appears to show a production config/data error: ${publicError}`);
  console.log(`ok customer safety ${path}`);
}

async function checkSearchPage(check) {
  const { response, text } = await fetchText(check.path);
  const lower = text.toLowerCase();

  requireStatus(response.status === 200, `${check.path} expected 200, got ${response.status}`);
  requireStatus(lower.includes(check.term), `${check.path} does not include expected search term "${check.term}"`);
  requireStatus(!lower.includes("no products found"), `${check.path} unexpectedly returned no products`);
  checkCustomerPageSafety(check.path, text);
  console.log(`ok search ${check.path}`);
}

async function main() {
  console.log(`Production smoke check: ${baseUrl}`);
  const pageResults = new Map();

  for (const check of publicChecks) {
    const html = await checkPublicPage(check);
    pageResults.set(check.path, html);

    if (customerPageChecks.has(check.path)) {
      checkCustomerPageSafety(check.path, html);
    }
  }

  for (const path of protectedApiChecks) {
    await checkProtectedApi(path);
  }

  for (const path of protectedPageChecks) {
    await checkProtectedPage(path);
  }

  for (const path of notFoundChecks) {
    await checkNotFound(path);
  }

  for (const check of searchChecks) {
    await checkSearchPage(check);
  }

  checkProductOgTags(pageResults.get("/product/1") ?? "", "product page");
  checkProductOgTags(pageResults.get("/share/product/1") ?? "", "share page");
  checkCatalogFeed(pageResults.get("/meta/catalog-feed.csv") ?? "");
  checkRobotsTxt(pageResults.get("/robots.txt") ?? "");
  console.log("Production smoke check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
