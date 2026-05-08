import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appAdminRoot = path.join(root, "src/app/admin");
const scanRoots = [path.join(root, "src/app/admin"), path.join(root, "src/components/admin")];

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function walk(directory, predicate) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function pagePathFromFile(file) {
  const relative = normalize(path.relative(path.join(root, "src/app"), file));
  return `/${relative.replace(/\/page\.tsx$/, "")}`;
}

function lineNumber(contents, index) {
  return contents.slice(0, index).split(/\r?\n/).length;
}

function main() {
  const pageFiles = walk(appAdminRoot, (file) => path.basename(file) === "page.tsx");
  const knownAdminPages = new Set(pageFiles.map(pagePathFromFile));
  const scanFiles = scanRoots.flatMap((scanRoot) => walk(scanRoot, (file) => [".ts", ".tsx"].includes(path.extname(file))));
  const failures = [];
  const linkPattern = /\b(?:href=|redirect\()\s*["'](\/admin(?:\/[A-Za-z0-9_-]+)*)["']/g;

  for (const file of scanFiles) {
    const relativePath = normalize(path.relative(root, file));
    const contents = readFileSync(file, "utf8");
    let match = linkPattern.exec(contents);

    while (match) {
      const href = match[1].replace(/\/+$/, "") || "/admin";
      if (!knownAdminPages.has(href)) {
        failures.push(`${relativePath}:${lineNumber(contents, match.index)} links to missing admin page ${href}.`);
      }

      match = linkPattern.exec(contents);
    }
  }

  if (failures.length) {
    console.error("Admin link check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin link check passed:");
  console.log(`- checked ${knownAdminPages.size} admin pages`);
  console.log("- static admin hrefs and redirects point to existing pages");
}

main();
