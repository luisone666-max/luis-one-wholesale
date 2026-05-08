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

function findMatchingBrace(contents, openBraceIndex) {
  let depth = 0;

  for (let index = openBraceIndex; index < contents.length; index += 1) {
    const char = contents[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function exportedMethods(contents) {
  const pattern = /export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\([^)]*\)\s*\{/g;
  const methods = [];
  let match = pattern.exec(contents);

  while (match) {
    const openBraceIndex = pattern.lastIndex - 1;
    const closeBraceIndex = findMatchingBrace(contents, openBraceIndex);

    methods.push({
      name: match[1],
      body: closeBraceIndex === -1 ? "" : contents.slice(openBraceIndex, closeBraceIndex + 1),
    });

    match = pattern.exec(contents);
  }

  return methods;
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

    for (const method of methods) {
      if (!method.body.includes("requireActiveAdminApi")) {
        failures.push(`${relativePath} ${method.name} is missing requireActiveAdminApi.`);
      }

      if (!method.body.includes("guard.response")) {
        failures.push(`${relativePath} ${method.name} does not return the admin guard response.`);
      }
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
  console.log("- every non-public admin API method uses requireActiveAdminApi");
}

main();
