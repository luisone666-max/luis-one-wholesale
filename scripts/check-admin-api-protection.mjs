import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const adminApiRoot = path.join(root, "src/app/api/admin");
const publicAdminApiRoutes = new Set([
  "src/app/api/admin/auth/login/route.ts",
  "src/app/api/admin/auth/logout/route.ts",
]);

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
}

function exportedMethods(contents) {
  return [...contents.matchAll(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\b/g)].map((match) => match[1]);
}

function main() {
  const failures = [];
  const files = walk(adminApiRoot);

  for (const file of files) {
    const relativePath = normalize(path.relative(root, file));
    const contents = readFileSync(file, "utf8");
    const methods = exportedMethods(contents);

    if (!methods.length) {
      failures.push(`${relativePath} does not export an HTTP handler.`);
      continue;
    }

    if (publicAdminApiRoutes.has(relativePath)) {
      continue;
    }

    if (!contents.includes("requireActiveAdminApi")) {
      failures.push(`${relativePath} is missing requireActiveAdminApi.`);
    }

    if (!contents.includes("guard.response")) {
      failures.push(`${relativePath} does not return the admin guard response.`);
    }
  }

  if (failures.length) {
    console.error("Admin API protection check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin API protection check passed:");
  console.log(`- checked ${files.length} admin route files`);
  console.log("- every non-public admin API uses requireActiveAdminApi");
}

main();
