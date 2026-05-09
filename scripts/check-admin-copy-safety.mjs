import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src/app/admin", "src/components/admin"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const suspiciousPatterns = [
  { pattern: /�/u, label: "replacement character" },
  { pattern: /锟斤拷/u, label: "common UTF-8 mojibake" },
  { pattern: /â[€™€œ€]/u, label: "common Windows-1252 mojibake" },
  { pattern: /Ã[\u0080-\u00ff]/u, label: "common Latin-1 mojibake" },
  { pattern: /\?{4,}/u, label: "four or more question marks" },
  { pattern: /[鎵鐜鏀璐绾棰鍏宸鍛瀹閽]/u, label: "common Chinese mojibake characters" },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
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

    for (const check of suspiciousPatterns) {
      const match = check.pattern.exec(contents);

      if (match?.index !== undefined) {
        failures.push(`${path.relative(root, file)}:${lineNumber(contents, match.index)} contains ${check.label}`);
      }
    }
  }

  if (failures.length) {
    console.error("Admin copy safety check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin copy safety check passed:");
  console.log("- no obvious mojibake, replacement characters, or corrupted question-mark copy found in admin UI");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
