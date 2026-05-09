import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src/app", "src/components"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const adminOnlyTerms = [
  "supplier_notes",
  "internal_cost_notes",
  "admin_notes",
  "supplier_notes_snapshot",
  "internal cost notes",
  "admin notes",
  "supplier notes snapshot",
];
const ignoredPathParts = [
  `${path.sep}admin${path.sep}`,
  `${path.sep}api${path.sep}`,
  `${path.sep}dev${path.sep}`,
  `${path.sep}print${path.sep}`,
  `${path.sep}share${path.sep}`,
  `${path.sep}meta${path.sep}`,
  `${path.sep}admin-`,
  `${path.sep}auth${path.sep}`,
];
function isIgnored(filePath) {
  const normalized = filePath.replaceAll("/", path.sep);
  return ignoredPathParts.some((part) => normalized.includes(part));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (extensions.has(path.extname(entry.name)) && !isIgnored(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumber(contents, index) {
  return contents.slice(0, index).split(/\r?\n/).length;
}

async function main() {
  const files = (await Promise.all(scanRoots.map((item) => walk(path.join(root, item))))).flat();
  const failures = [];

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    const lower = contents.toLowerCase();

    for (const term of adminOnlyTerms) {
      const index = lower.indexOf(term);
      if (index >= 0) {
        failures.push(`${path.relative(root, file)}:${lineNumber(contents, index)} contains admin-only term "${term}"`);
      }
    }

    const cjkMatch = contents.match(/[\u3400-\u9fff]/u);
    if (cjkMatch?.index !== undefined) {
      failures.push(`${path.relative(root, file)}:${lineNumber(contents, cjkMatch.index)} contains CJK text in customer-facing code`);
    }
  }

  if (failures.length) {
    console.error("Customer frontend safety check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Customer frontend safety check passed:");
  console.log("- no admin-only product/order note fields found in customer app/components");
  console.log("- no Chinese customer-facing copy found in customer app/components");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
