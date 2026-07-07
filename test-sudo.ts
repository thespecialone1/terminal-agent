import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

console.log("Setting raw mode true...");
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

setTimeout(async () => {
  console.log("Pausing stdin and running sudo echo hi...");
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  
  try {
    const { stdout } = await execAsync("sudo -S echo hi < /dev/tty"); // Force reading from tty if possible, or just sudo echo hi
    console.log("STDOUT:", stdout);
  } catch (e) {
    console.error("ERROR", e);
  }
  process.exit(0);
}, 1000);
