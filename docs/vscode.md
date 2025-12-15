# VS Code Configuration

This document provides recommended VS Code configurations for debugging the project.

## Launch Configurations

Create a `.vscode/launch.json` file in the root of your workspace with the following content:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend (tsx)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["--tsconfig", "./tsconfig.app.json", "bin/index.ts"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Backend (tsx watch)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["watch", "--tsconfig", "./tsconfig.app.json", "bin/index.ts"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Current File (tsx)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["--tsconfig", "./tsconfig.app.json", "${file}"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Configuration Details

### Debug Backend (tsx)

Runs the backend application once using `tsx` directly. This is useful for step-by-step debugging without auto-reload.

- **Entry point**: `bin/index.ts`
- **TypeScript config**: `tsconfig.app.json`
- **Environment**: `NODE_ENV=development`

### Debug Backend (tsx watch)

Runs the backend application in watch mode. The debugger will restart automatically when files change.

> **Note**: When the server reloads, you may need to set breakpoints again.

### Debug Current File (tsx)

Runs and debugs the currently open TypeScript file. Useful for testing isolated scripts or modules.

## Prerequisites

Make sure you have installed the project dependencies:

```bash
pnpm install
```

The `tsx` package should be available in `node_modules/.bin/tsx`.

## Tips

- Use **F5** to start debugging with the currently selected configuration.
- Use **Ctrl+Shift+D** to open the Run and Debug panel.
- Set breakpoints by clicking on the left margin of the editor.
