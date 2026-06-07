const { spawn } = require("child_process");
const path = require("path");

const isRender = Boolean(
  String(process.env.RENDER || "").trim() ||
  String(process.env.RENDER_SERVICE_ID || "").trim()
);

const defaultMemoryMb = isRender ? 4096 : 4096;
const configuredMemoryMb = Number(process.env.NODE_MAX_OLD_SPACE_SIZE || defaultMemoryMb);
const maxOldSpaceSizeMb = Number.isFinite(configuredMemoryMb) && configuredMemoryMb > 0
  ? Math.trunc(configuredMemoryMb)
  : defaultMemoryMb;

const existingNodeOptions = String(process.env.NODE_OPTIONS || "").trim();
const memoryFlag = `--max-old-space-size=${maxOldSpaceSizeMb}`;
const nodeOptions = existingNodeOptions.includes("--max-old-space-size=")
  ? existingNodeOptions
  : [existingNodeOptions, memoryFlag].filter(Boolean).join(" ");

const env = {
  ...process.env,
  NODE_OPTIONS: nodeOptions,
  GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP || "false",
  DISABLE_ESLINT_PLUGIN: process.env.DISABLE_ESLINT_PLUGIN || "true",
};

const reactScriptsBin = require.resolve("react-scripts/bin/react-scripts");

const child = spawn(process.execPath, [reactScriptsBin, "build"], {
  stdio: "inherit",
  env,
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
