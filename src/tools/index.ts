import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const execAsync = promisify(exec);

// We remove the `execute` function from ALL tools to prevent the AI SDK from auto-executing them.
// This allows us to fully control execution in `cli.tsx` (e.g. for confirmation modals).
export const agentTools = {
  read_file: tool({
    description: 'Read the contents of a file from the local file system.',
    parameters: z.object({
      path: z.string().describe('The absolute or relative path to the file to read'),
    }),
  } as any),
  
  write_file: tool({
    description: 'Write content to a file on the local file system.',
    parameters: z.object({
      path: z.string().describe('The absolute or relative path to the file to write'),
      content: z.string().describe('The content to write to the file'),
    }),
  } as any),
  
  execute_command: tool({
    description: 'Execute a bash command in the terminal.',
    parameters: z.object({
      command: z.string().describe('The bash command to execute'),
    }),
  } as any),
  
  change_directory: tool({
    description: 'Change the current working directory for the agent. ALWAYS use this instead of running "cd" via execute_command.',
    parameters: z.object({
      path: z.string().describe('The absolute or relative path to the directory'),
    }),
  } as any),
  
  spawn_subagent: tool({
    description: 'Spawn a background sub-agent to perform a complex or long-running task. The sub-agent will run in a new session.',
    parameters: z.object({
      task_name: z.string().describe('A short, descriptive name for the background session'),
      task_description: z.string().describe('Detailed instructions for the sub-agent to execute'),
    }),
  } as any),
};

export async function executePendingTool(toolName: string, args: any): Promise<string> {
  try {
    if (toolName === 'read_file') {
      const pathToRead = args.path || args.file_path || '.';
      const content = await fs.readFile(pathToRead, 'utf-8');
      return content;
    } else if (toolName === 'write_file') {
      await fs.writeFile(args.path, args.content, 'utf-8');
      return `Successfully wrote to ${args.path}`;
    } else if (toolName === 'change_directory') {
      try {
        process.chdir(args.path);
        return `Changed working directory to ${process.cwd()}`;
      } catch (e) {
        return `Failed to change directory: ${e instanceof Error ? e.message : String(e)}`;
      }
    } else if (toolName === 'execute_command') {
      const cmd = args.command.trim();
      
      // Intercept 'cd' commands to actually change the Node process working directory
      if (cmd.startsWith('cd ')) {
        const targetDir = cmd.substring(3).trim();
        try {
          process.chdir(targetDir);
          return `Changed working directory to ${process.cwd()}`;
        } catch (e) {
          return `Failed to change directory: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      return new Promise((resolve) => {
        // Suspend TUI and input capture
        process.stdout.write('\x1b[?1049l'); // exit alternate screen
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
          process.stdin.pause();
        }

        const child = require('node:child_process').spawn(cmd, { 
          shell: true, 
          stdio: ['inherit', 'pipe', 'pipe'],
          cwd: process.cwd()
        });

        let output = '';
        
        child.stdout.on('data', (data: any) => {
          output += data;
          process.stdout.write(data);
        });
        
        child.stderr.on('data', (data: any) => {
          output += data;
          process.stderr.write(data);
        });

        const onFinish = (code: number) => {
          // Resume TUI and input capture
          process.stdout.write('\x1b[?1049h'); // enter alternate screen
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
          }
          resolve(output || `Command exited with code ${code}`);
        };

        child.on('close', onFinish);
        child.on('error', (err: any) => {
          onFinish(1);
          resolve(`Error: ${err.message}`);
        });
      });
    }
    return `Unknown tool: ${toolName}`;
  } catch (error) {
    return `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
  }
}
