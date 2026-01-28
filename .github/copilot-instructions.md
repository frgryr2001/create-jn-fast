# Copilot Instructions for create-jn-fast

## Project Overview

This is a **Turborepo monorepo** hosting `create-jn` - a CLI tool for scaffolding React projects with customizable templates and tools. Think "create-vite" or "create-next-app" style generator.

### Architecture

- **Main Package**: [`packages/create-jn`](packages/create-jn) - CLI scaffolding tool
- **Templates**: [`packages/create-jn/templates/`](packages/create-jn/templates/) - Base project templates (React, Shadcn, Tailwind)
- **Shared Configs**: `packages/eslint-config` and `packages/typescript-config`

## Key Developer Workflows

### Building & Testing the CLI

```bash
# Navigate to create-jn package
cd packages/create-jn

# Build with tsdown (outputs to dist/)
pnpm run build

# Dev mode with watch + auto-run (uses __scaffold__ dir for testing)
pnpm run dev

# Test the CLI locally
pnpm run build && node dist/index.js
```

**Critical**: In dev mode (`npm_lifecycle_event === 'dev'`), projects scaffold to `__scaffold__/<project-name>` to avoid polluting workspace (see [index.ts](packages/create-jn/src/index.ts#L51)).

### Turbo Commands (from root)

```bash
pnpm run build    # Build all packages
pnpm run dev      # Watch mode for all packages
pnpm run lint     # Lint all packages
```

## Project-Specific Patterns

### Template System

Templates live in [`packages/create-jn/templates/`](packages/create-jn/templates/). Each template is a standalone project structure.

**Adding a new template**:
1. Create `template-{name}/` folder with full project structure
2. Add to [`templates.ts`](packages/create-jn/src/templates.ts):
```typescript
{
  value: 'template-{name}',
  label: '{Display Name}',
  hint: '{Description}',
}
```

### Extra Tools System (Composable Enhancements)

Users can select additional tools (Tailwind CSS, Shadcn UI) after choosing a base template. Tools are defined in [`tools.ts`](packages/create-jn/src/tools.ts).

**Pattern**: Each tool has an `action` function that:
- Copies files from `template-{tool}/` to the project
- Merges `package.json` dependencies via `mergePackageJson()`
- Applies file modifications (e.g., inject Tailwind imports into CSS)

**Example**: Shadcn tool copies `lib/`, `global.css`, overwrites `tsconfig.json`, and merges dependencies.

### Package.json Personalization

The CLI auto-fills `author` from git config ([index.ts](packages/create-jn/src/index.ts#L220-L228)):
```typescript
const name = execSync('git config user.name').toString().trim();
const email = execSync('git config user.email').toString().trim();
pkg.author = email ? `${name} <${email}>` : name;
```

### File Copying Behavior

- **Ignored folders**: `node_modules`, `dist`, `.git`, etc. (see `IGNORE_FOLDERS` in [`utils.ts`](packages/create-jn/src/utils.ts#L9-L22))
- **File renaming**: `_gitignore` → `.gitignore` ([index.ts](packages/create-jn/src/index.ts#L28))
- **Dev dependencies**: Scaffold directly depends on CLI-bundled deps (`@clack/prompts`, `minimist`), not user projects

## Critical Implementation Details

### Build Tool: tsdown

Uses [tsdown](https://tsdown.vercel.app/) (not tsc) for bundling. Config at [`tsdown.config.ts`](packages/create-jn/tsdown.config.ts):
- Entry: `src/index.ts`
- Output: ESM to `dist/index.js`
- Dev mode runs `node dist/index.js` on change

### CLI Entry Point

Shebang `#!/usr/bin/env node` in [`index.ts`](packages/create-jn/src/index.ts#L1). Package.json `bin` points to `dist/index.js`.

### Prompt Library

Uses **@clack/prompts** (not inquirer). Key patterns:
- Check `p.isCancel()` after every prompt
- Exit with `p.cancel('message')` + `process.exit(1)` on cancel
- `p.log.info()`, `p.log.success()` for output

## Things to Avoid

- **Don't** add dependencies to template package.json that are only needed during scaffolding (they ship to users)
- **Don't** use `fs.rmSync(root)` directly - use `rmdirPreserveGit()` to preserve `.git` folder
- **Don't** hardcode paths - use `getTemplatesDir()` to resolve templates directory
- **Don't** modify files in `templates/` during runtime - they're source templates

## Integration Points

- **Git**: Reads user config for author field, preserves `.git` on overwrite
- **Package Manager Detection**: Sniffs `npm_config_user_agent` to show correct install commands (npm/yarn/pnpm)
- **Template Isolation**: Templates can reference each other (Shadcn depends on Tailwind structure)

## Conventions

- **File organization**: Template-specific logic in `tools.ts`, shared utilities in `utils.ts`
- **Error handling**: Try-catch around git commands, warn-and-continue for tool actions
- **Naming**: Templates prefixed with `template-`, tools use lowercase slugs (`tailwindcss`, `shadcn`)

---

**Quick Reference**:
- Test CLI: `cd packages/create-jn && pnpm run dev my-test-app`
- Add template: Create folder + edit `templates.ts`
- Add tool: Create template folder + define in `tools.ts` with `action()` function
