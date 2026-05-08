import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".sql",
  ".toml",
  ".yml",
  ".yaml",
]);

const secretPatterns = [
  { label: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]{12,}\b/g },
  { label: "Supabase personal access token", pattern: /\bsbp_[A-Za-z0-9_-]{20,}\b/g },
  {
    label: "JWT-looking Supabase key",
    pattern: /\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
];

const serverOnlyServiceRolePaths = [
  "src/app/api/",
  "src/app/dev/",
  "src/lib/supabase/server-config.ts",
  "src/lib/supabase/server.ts",
  "supabase/functions/",
];

const nonCodeServiceRolePaths = ["docs/", "scripts/", "supabase/migrations/"];

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function lineNumber(contents, index) {
  return contents.slice(0, index).split(/\r?\n/).length;
}

function isTracked(filePath) {
  try {
    git(["ls-files", "--error-unmatch", filePath]);
    return true;
  } catch {
    return false;
  }
}

function isIgnored(filePath) {
  try {
    git(["check-ignore", filePath]);
    return true;
  } catch {
    return false;
  }
}

function getTrackedFiles() {
  const output = git(["ls-files"]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function hasSourceExtension(filePath) {
  return sourceExtensions.has(path.extname(filePath).toLowerCase());
}

function isAllowedServiceRolePath(filePath) {
  const normalized = normalize(filePath);
  return [...serverOnlyServiceRolePaths, ...nonCodeServiceRolePaths].some((prefix) => normalized.startsWith(prefix));
}

function isServerCodeServiceRolePath(filePath) {
  const normalized = normalize(filePath);
  return serverOnlyServiceRolePaths.some((prefix) => normalized.startsWith(prefix));
}

function checkEnvFiles(failures) {
  if (!existsSync(path.join(root, ".env.example"))) {
    failures.push(".env.example is missing.");
  } else {
    const contents = readFileSync(path.join(root, ".env.example"), "utf8");
    const badLines = contents
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => line && !line.startsWith("#"))
      .filter(({ line }) => {
        const equalsIndex = line.indexOf("=");
        return equalsIndex < 0 || line.slice(equalsIndex + 1).trim().length > 0;
      });

    for (const { line, number } of badLines) {
      failures.push(`.env.example:${number} should contain variable names only, found "${line}".`);
    }
  }

  if (isTracked(".env.local")) {
    failures.push(".env.local is tracked by git.");
  }

  if (existsSync(path.join(root, ".env.local")) && !isIgnored(".env.local")) {
    failures.push(".env.local exists but is not ignored by git.");
  }
}

function checkHardcodedSecrets(files, failures) {
  for (const file of files) {
    if (!hasSourceExtension(file)) {
      continue;
    }

    const contents = readFileSync(path.join(root, file), "utf8");

    for (const { label, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      let match = pattern.exec(contents);
      while (match) {
        failures.push(`${file}:${lineNumber(contents, match.index)} contains a ${label}.`);
        match = pattern.exec(contents);
      }
    }
  }
}

function checkServiceRoleUsage(files, failures) {
  for (const file of files) {
    if (!hasSourceExtension(file)) {
      continue;
    }

    const normalized = normalize(file);
    const contents = readFileSync(path.join(root, file), "utf8");

    if (!contents.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      continue;
    }

    if (!isAllowedServiceRolePath(normalized)) {
      failures.push(`${file} references SUPABASE_SERVICE_ROLE_KEY outside the approved server-only/script/docs paths.`);
      continue;
    }

    if (normalized.startsWith("src/") && contents.includes('"use client"')) {
      failures.push(`${file} references SUPABASE_SERVICE_ROLE_KEY in a client component/module.`);
    }

    if (normalized.startsWith("src/") && !isServerCodeServiceRolePath(normalized)) {
      failures.push(`${file} references SUPABASE_SERVICE_ROLE_KEY in source code that is not explicitly server-only.`);
    }
  }
}

function checkClientAdminTerms(files, failures) {
  const clientRiskTerms = ["supplier_notes", "internal_cost_notes", "admin_notes", "supplier_notes_snapshot"];

  for (const file of files) {
    const normalized = normalize(file);
    if (!normalized.startsWith("src/") || normalized.startsWith("src/app/api/") || normalized.includes("/admin/")) {
      continue;
    }

    if (![".ts", ".tsx", ".js", ".jsx"].includes(path.extname(file).toLowerCase())) {
      continue;
    }

    const contents = readFileSync(path.join(root, file), "utf8");
    if (!contents.includes('"use client"')) {
      continue;
    }

    for (const term of clientRiskTerms) {
      const index = contents.indexOf(term);
      if (index >= 0) {
        failures.push(`${file}:${lineNumber(contents, index)} references admin-only field "${term}" in client code.`);
      }
    }
  }
}

function main() {
  const failures = [];
  const files = getTrackedFiles();

  checkEnvFiles(failures);
  checkHardcodedSecrets(files, failures);
  checkServiceRoleUsage(files, failures);
  checkClientAdminTerms(files, failures);

  if (failures.length) {
    console.error("Secret safety check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Secret safety check passed:");
  console.log("- .env.local is ignored and not tracked");
  console.log("- .env.example contains variable names only");
  console.log("- no real Supabase secret tokens or JWT keys are committed");
  console.log("- service role env access is limited to server-only/script/docs paths");
}

main();
