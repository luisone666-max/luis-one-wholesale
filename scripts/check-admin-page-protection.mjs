import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const adminPageRoot = path.join(root, "src/app/admin");
const publicAdminPages = new Set(["src/app/admin/login/page.tsx"]);
const redirectOnlyPages = new Map([["src/app/admin/wholesale-prices/page.tsx", "/admin/products"]]);

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

    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const failures = [];
  const files = walk(adminPageRoot);

  for (const file of files) {
    const relativePath = normalize(path.relative(root, file));
    const contents = readFileSync(file, "utf8");

    if (publicAdminPages.has(relativePath)) {
      continue;
    }

    const redirectTarget = redirectOnlyPages.get(relativePath);
    if (redirectTarget) {
      if (!contents.includes(`redirect("${redirectTarget}")`) && !contents.includes(`redirect('${redirectTarget}')`)) {
        failures.push(`${relativePath} is marked redirect-only but does not redirect to ${redirectTarget}.`);
      }
      continue;
    }

    if (!contents.includes("requireActiveAdminPage")) {
      failures.push(`${relativePath} is missing requireActiveAdminPage.`);
    }
  }

  if (failures.length) {
    console.error("Admin page protection check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin page protection check passed:");
  console.log(`- checked ${files.length} admin page files`);
  console.log("- every non-public admin page is protected or redirects to a protected admin page");
}

main();
