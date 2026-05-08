import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "src/app");
const scanRoots = [path.join(root, "src/app"), path.join(root, "src/components")];

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function walk(directory, predicate, skipDirectory = () => false) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!skipDirectory(fullPath)) {
        files.push(...walk(fullPath, predicate, skipDirectory));
      }
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function routePathFromFile(file) {
  const relative = normalize(path.relative(appRoot, file));
  const routePath = `/${relative.replace(/\/(?:page|route)\.(?:ts|tsx)$/, "")}`;
  return routePath === "/page.tsx" ? "/" : routePath;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeToRegex(route) {
  if (route === "/") {
    return /^\/$/;
  }

  const pattern = route
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (/^\[\.\.\.[^\]]+\]$/.test(segment)) {
        return ".+";
      }

      if (/^\[[^\]]+\]$/.test(segment)) {
        return "[^/]+";
      }

      return escapeRegex(segment);
    })
    .join("/");

  return new RegExp(`^/${pattern}$`);
}

function stripUrlDecoration(href) {
  const [withoutHash] = href.split("#");
  const [withoutQuery] = withoutHash.split("?");
  const normalized = withoutQuery.replace(/\/+$/, "");
  return normalized || "/";
}

function lineNumber(contents, index) {
  return contents.slice(0, index).split(/\r?\n/).length;
}

function shouldSkipHref(href) {
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("//") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function isCustomerScanDirectory(directory) {
  const normalized = normalize(path.relative(root, directory));
  return (
    normalized === "src/app/admin" ||
    normalized === "src/app/api" ||
    normalized === "src/app/dev" ||
    normalized === "src/components/admin"
  );
}

function main() {
  const routeFiles = walk(appRoot, (file) => {
    const basename = path.basename(file);
    return basename === "page.tsx" || basename === "route.ts";
  });
  const routePatterns = routeFiles.map(routePathFromFile).map(routeToRegex);
  const scanFiles = scanRoots.flatMap((scanRoot) =>
    walk(
      scanRoot,
      (file) => [".ts", ".tsx"].includes(path.extname(file)),
      isCustomerScanDirectory,
    ),
  );

  const failures = [];
  const linkPattern =
    /\b(?:href=|router\.(?:push|replace)\(|redirect\(|window\.location(?:\.href)?\s*=)\s*["'](\/[^"']*)["']/g;

  for (const file of scanFiles) {
    const relativePath = normalize(path.relative(root, file));
    const contents = readFileSync(file, "utf8");
    let match = linkPattern.exec(contents);

    while (match) {
      const href = match[1];

      if (!shouldSkipHref(href)) {
        const target = stripUrlDecoration(href);
        const found = routePatterns.some((pattern) => pattern.test(target));

        if (!found) {
          failures.push(`${relativePath}:${lineNumber(contents, match.index)} links to missing customer route ${href}.`);
        }
      }

      match = linkPattern.exec(contents);
    }
  }

  if (failures.length) {
    console.error("Customer link check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Customer link check passed:");
  console.log(`- checked ${scanFiles.length} customer-facing source files`);
  console.log("- static customer hrefs, redirects, and router navigation point to existing routes");
}

main();
