import { defineConfig } from 'tsup';
import {exec} from 'child_process';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  splitting: false,
  skipNodeModulesBundle: false,
  bundle: true,
  external: [],       // ← Make sure this is empty
  noExternal: [/./],  // ← Regex that matches everything
  onSuccess: () => {
    return new Promise((resolve, reject) => {
      exec("cp dist/index.js ../mercury-web-backend/create-vulcan-workflow.js", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          reject (`Error executing command: ${error.message}`);
        } else if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject(`stderr: ${stderr}`);
        } else {
          console.log(`stdout: ${stdout}`);
          resolve();
        }
      });
    })
  }
});