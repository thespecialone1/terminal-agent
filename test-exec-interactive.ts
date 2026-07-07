import { execSync } from "child_process";

try {
  // Capture stdout and stderr, but inherit stdin
  const output = execSync("sudo -S echo hi", { stdio: ['inherit', 'pipe', 'pipe'] });
  console.log("SUCCESS:", output.toString());
} catch (e) {
  console.log("ERROR:", e.stderr?.toString() || e.message);
}
