import { spawn } from "node:child_process";

const suites = {
  maintenance: [
    ["check:secrets", "Secret safety"],
    ["check:customer-safety", "Customer frontend safety"],
    ["check:admin-api", "Admin API protection"],
    ["check:admin-pages", "Admin page protection"],
    ["check:admin-roles", "Admin role access"],
    ["check:admin-links", "Admin navigation links"],
    ["check:customer-links", "Customer navigation links"],
    ["lint", "ESLint"],
    ["check:pos", "Offline POS flow"],
    ["check:loyalty", "Online loyalty flow"],
    ["check:production", "Production smoke"],
    ["build", "Production build"],
  ],
  readiness: [
    ["check:schema", "Database schema readiness"],
    ["check:pos:corrections", "POS correction workflow"],
  ],
};

function commandForScript(script) {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `npm.cmd run ${script}`],
    };
  }

  return {
    command: "npm",
    args: ["run", script],
  };
}

function runScript(script, label) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    console.log("");
    console.log(`==> ${label}`);
    const command = commandForScript(script);
    const child = spawn(command.command, command.args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);

      if (code === 0) {
        console.log(`<== ${label} passed in ${seconds}s`);
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const mode = process.argv[2] === "readiness" ? "readiness" : "maintenance";
  const checks = suites[mode];
  const started = Date.now();

  console.log(`Running ${mode} checks (${checks.length} steps).`);

  for (const [script, label] of checks) {
    await runScript(script, label);
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log("");
  console.log(`${mode} checks passed in ${seconds}s.`);

  if (mode === "maintenance") {
    console.log("Schema readiness is separate: run `npm.cmd run check:readiness` only after new production migrations are applied.");
  }
}

main().catch((error) => {
  console.error("");
  console.error(error.message);
  process.exit(1);
});
